import { Prisma, TenantPreference, TenantType } from '@prisma/client';
import {
  ListingType,
  PropertyCategory,
  PropertySubType,
  FurnishingType,
  UrgencyLevel,
  PropertyStatus,
  LeadStage,
} from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { looksLikeGarbageName } from '../../common/utils/nameSanitizer';
import { PrismaService } from '../../prisma/prisma.service';
import { AiParseResult } from '../ai-parser/ai-parser.service';
import { ALLOWED_RESTRICTION_CODES } from "./tenantRules";
import { AiParserService } from '../ai-parser/ai-parser.service';
import {ClientProperty, Client, ClientEvent, PrismaClient} from '@prisma/client';
@Injectable()
export class PropertiesService {
  // getAllLeads(query: any) {
  //   throw new Error('Method not implemented.');
  // }
  constructor(
  private prisma: PrismaService,
  private aiParserService: AiParserService,
) {}

  

  // ================= AI INGEST =================

  async createFromAi(

    messageId: string,
    aiResult: AiParseResult,
    senderNumber?: string | null
  ) {

    

    console.log("🔥 NEW PROPERTY SERVICE CODE RUNNING 🔥");

    const cleanSender = extractIndianPhone(senderNumber || null);

    if (!aiResult || !Array.isArray(aiResult.properties)) return;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      await this.logIngestion(
        "ERROR",
        "MESSAGE_NOT_FOUND",
        "Message missing during property ingestion",
        messageId
      );
      return;
    }
    

    const rawText = message?.rawText || "";

    const properties = aiResult.properties;
    const contactBlock = aiResult.contactBlock || {};
    const aiContacts = normalizeContacts(contactBlock.contacts || []);

    for (const item of properties as any[]) {

      // Tenant rules
      const tenantTypes = sanitizeTenantTypes((item as any).tenantTypes);
      const tenantRestrictions = sanitizeTenantRestrictions(
        (item as any).tenantRestrictions
      );

      const created = await this.prisma.property.create({
        data: {
          messageId,

          listingType: mapListingType(item.listingType),
          propertyCategory: mapPropertyCategory(item.propertyCategory),
          propertySubType: mapPropertySubType(item.propertySubType),

          country: item.country || null,
          city: item.city || null,
          area: item.area || null,
          building: item.building || null,
          location: item.location || null,

          price: item.price ? BigInt(item.price) : null,
          deposit: item.deposit ? BigInt(item.deposit) : null,
          bhk: normalizeBhk(item.bhk),
          areaSqft: item.areaSqft || null,
          furnishing: mapFurnishing(item.furnishing),

          urgencyLevel: mapUrgency(item.urgencyLevel),

          tenantTypes,
          tenantRestrictions,
          
          // legacy snapshot only (for debugging / backward compatibility)
          firmName: null,
          agentName: null,

          // legacy fields (keep for now)
          contacts: aiContacts,
          senderContact: cleanSender,
          rawContactBlock: JSON.stringify(contactBlock),

          confidence: item.confidence || 0.0,
          status: this.calculateStatusNew(item),
          availability: 'available',

          leadStage: LeadStage.NEW,
          followUpAt: null,
          lastContactedAt: null,
        },
      });

      console.log("🔥 ABOUT TO ATTACH AGENTS 🔥");

      // 🔥 Attach agents (REAL LOGIC)
      await this.attachAgentsToProperty(
        created.id,
        aiContacts,
        rawText,
        cleanSender,
        contactBlock.agentName || null,
        contactBlock.firmName || null,
      );

      // Activity log
      await this.prisma.propertyActivity.create({
        data: {
          propertyId: created.id,
          action: 'CREATED',
          oldData: Prisma.JsonNull,
          newData: created as any,
          userName: 'Dipanshu (Admin)',
        },
      });
    }
    
    
  }

  calculateStatusNew(item: any): PropertyStatus {
    if (!item.confidence || item.confidence < 0.6) return PropertyStatus.REVIEW;
    if (!item.price || !item.location || !item.area)
      return PropertyStatus.REVIEW;
    return PropertyStatus.APPROVED;
  }

  async getNeighbors(id: string, query: any) {
    const { items } = await this.findAll({
      ...query,
      limit: 1000, // safe upper bound OR smarter window
      page: 1,
    });
  
    const index = items.findIndex(p => p.id === id);
  
    return {
      prevId: index > 0 ? items[index - 1].id : null,
      nextId: index < items.length - 1 ? items[index + 1].id : null,
    };
  }
  

  // ================= AGENT SYSTEM =================

  private async attachAgentsToProperty(
    propertyId: string,
    aiContacts: string[],
    rawText: string,
    senderContact: string | null,
    agentName: string | null,
    firmName: string | null,
    ) {
      let globalFirm: string | null = firmName || null;
      console.log("🧪 attachAgentsToProperty DATA:");
      console.log("propertyId =", propertyId);
      console.log("aiContacts =", aiContacts);
      console.log("rawText =", rawText);
      console.log("senderContact =", senderContact);
      console.log("agentName =", agentName);
  
      type AgentCandidate = {
      name: string | null;
      firm: string | null;
      phones: string[];

    };
  
    const lines = (rawText || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  
      
      
      let currentName: string | null = null;
      let currentFirm: string | null = null;
      let currentPhones: string[] = [];
      const candidates: AgentCandidate[] = [];
      
      function flushCurrent() {
        if (currentPhones.length > 0) {
          candidates.push({
            name: currentName,
            firm: currentFirm || globalFirm,
            phones: Array.from(new Set(currentPhones)),
          });
        }
        currentName = null;
        currentFirm = null;
        currentPhones = [];
      }
      
    function extractPhonesFromLine(line: string): string[] {
      const matches = line.match(/\+?\d[\d\s\-]{8,}/g) || [];
      const out: string[] = [];
      for (const m of matches) {
        const p = normalizePhone(m);
        if (p) out.push(p);
      }
      return out;
    }
  
    function cleanName(line: string): string | null {
      if (!line) return null;
    
      let s = line.trim();
    
      /* ---------------- BLOCK LABEL LINES ---------------- */
    
      const labelWords = [
        "mobile",
        "phone",
        "contact",
        "whatsapp",
        "call",
        "number",
      ];
    
      const normalized = s.toLowerCase().replace(":", "").trim();
      if (labelWords.includes(normalized)) return null;
    
      /* ---------------- REMOVE PHONES ---------------- */
    
      s = s.replace(/\+?\d[\d\s\-]{8,}/g, " ");
    
      /* ---------------- REMOVE JUNK PHRASES ---------------- */
    
      const junkWords = [
        "visit",
        "inspection",
        "available",
        "allowed",
        "family",
        "bachelors",
        "only",
        "rent",
        "sale",
        "flat",
        "bhk",
        "sqft",
        "price",
        "deposit",
        "realty",
        "property",
        "properties",
        "estate",
        "broker",
        "consultant",
      ];
    
      const lower = s.toLowerCase();
      if (junkWords.some(w => lower.includes(w))) return null;
    
      /* ---------------- CLEAN PUNCTUATION ---------------- */
    
      s = s.replace(/[-,–—:]+/g, " ");
      s = s.replace(/\s+/g, " ").trim();
    
      /* ---------------- STRUCTURE ---------------- */
    
      const parts = s.split(" ");
      if (parts.length < 1 || parts.length > 3) return null;
    
      // Must look like a name (capitalized words)
      for (const p of parts) {
        if (!/^[A-Z][a-z]+$/.test(p)) return null;
      }
    
      /* ---------------- FINAL AUTHORITY ---------------- */
    
      return isValidHumanName(s) ? s : null;
    }
    
    
  
    function looksLikeFirm(line: string): boolean {
      const l = line.toLowerCase();
      return [
        "realty",
        "real estate",
        "estate",
        "properties",
        "property",
        "broker",
        "consultant",
        "associates",
        "group",
        "infratech",
        "developers",
      ].some(k => l.includes(k));
    }
    
  
    // 1️⃣ Walk line-by-line and build blocks
    for (const line of lines) {
      const phones = extractPhonesFromLine(line);
  
      if (phones.length > 0) {
        // This line contains phone numbers
        currentPhones.push(...phones);
  
        // Maybe same line also has name
        const maybeName = cleanName(line);
        if (maybeName && !currentName) {
          currentName = maybeName;
        }
  
        continue;
      }
  
      // No phone in this line
  
      // If we already started collecting phones, this might be firm
      // if (currentPhones.length > 0) {
      //   if (looksLikeFirm(line)) {
      //     if (currentPhones.length > 0) {
      //       // firm belongs to current agent
      //       currentFirm = line;
      //     } else {
      //       // firm is global
      //       globalFirm = line;
      //     }
      //     continue;
      //   }

  
      //   // Otherwise, this means previous block is done
      //   flushCurrent();

      //   // Now this line might be name of next person
      //   const maybeName = cleanName(line);
      //   if (maybeName) currentName = maybeName;
      //   continue;
      // }

      if (looksLikeFirm(line)) {
        if (currentPhones.length > 0) {
          currentFirm = line;
        } else {
          globalFirm = line;
      
          // 🔥 Apply to previous candidates if they don't have firm
          for (const c of candidates) {
            if (!c.firm) c.firm = globalFirm;
          }
        }
        continue;
      }
      
      
  
      // No phones yet, no active block
      const maybeName = cleanName(line);
      if (maybeName) {
        if (currentPhones.length > 0) {
          flushCurrent();   // 👈 VERY IMPORTANT
        }
        currentName = maybeName;
        continue;
      }

    }
  
    // Flush last block
    flushCurrent();
  
    // 2️⃣ Fallback if nothing found in message
    if (candidates.length === 0) {
      const phonesFromAi = (aiContacts || [])
        .map(normalizePhone)
        .filter(Boolean) as string[];
    
      if (phonesFromAi.length > 0) {
        candidates.push({
          name: agentName || null,
          firm: firmName || null,
          phones: phonesFromAi,
        });
      } else {
        const sender = normalizePhone(senderContact || "");
        if (sender) {
          candidates.push({
            name: agentName || null,
            firm: firmName || null,
            phones: [sender],
          });
        }
      }
    }

    if (candidates.length === 0) {
      await this.logIngestion(
        "ERROR",
        "NO_AGENT_FOUND_FINAL",
        "No agent could be extracted even after fallback",
        propertyId,
        { rawText }
      );
    }
    
    if (candidates.length > 3) {
      await this.logIngestion(
        "WARN",
        "TOO_MANY_AGENTS",
        "More than 3 agents detected in one message",
        propertyId,
        { count: candidates.length }
      );
    }
    
    for (const c of candidates) {
      if (c.phones.length > 3) {
        await this.logIngestion(
          "WARN",
          "TOO_MANY_PHONES",
          "Agent has more than 3 phones",
          propertyId,
          { name: c.name, phones: c.phones }
        );
      }
    }
  
    // 3️⃣ Persist to DB
    for (const candidate of candidates) {
      // Try to find existing agent by any phone
      let agent: import("@prisma/client").Agent | null = null;
  
      for (const phone of candidate.phones) {
        const agentPhone = await this.prisma.agentPhone.findUnique({
          where: { phone },
          include: { agent: true },
        });
  
        if (agentPhone) {
          agent = agentPhone.agent;
        
          if (
            agent.name &&
            candidate.name &&
            agent.name.trim().toLowerCase() !== candidate.name.trim().toLowerCase()
          ) {
            await this.logIngestion(
              "ERROR",
              "NAME_CONFLICT",
              "Same phone number seen with different names",
              propertyId,
              {
                phone,
                existingName: agent.name,
                newName: candidate.name,
              }
            );
          }
          break; // ✅ STOP at first match
        }
        
      }
  
      if (!agent) {
        /* ------------------------------------------------
           1️⃣ Validate pipeline sanity
        ------------------------------------------------ */
        if (!agentName && aiContacts.length === 0 && !senderContact) {
          throw new Error("Contact block missing in ingestion pipeline");
        }
      
        /* ------------------------------------------------
           2️⃣ Resolve firm name (STRICT RULE)
              - ONLY from contactBlock
              - NEVER infer from raw text
        ------------------------------------------------ */
        const finalFirmName =
          firmName && looksLikeFirm(firmName) ? firmName : null;
      
        /* ------------------------------------------------
           3️⃣ Resolve & sanitize agent name
              Priority:
              1. candidate.name (from rawText)
              2. agentName (from AI contact block)
              3. null (phone-only agent)
        ------------------------------------------------ */
        let finalName: string | null = null;
      
        const cleanedCandidateName = candidate.name
          ? sanitizeHumanName(candidate.name)
          : null;
      
        if (cleanedCandidateName && isValidHumanName(cleanedCandidateName)) {
          finalName = cleanedCandidateName;
        } else {
          const cleanedAgentName = agentName
            ? sanitizeHumanName(agentName)
            : null;
      
          if (cleanedAgentName && isValidHumanName(cleanedAgentName)) {
            finalName = cleanedAgentName;
          }
        }
      
        /* ------------------------------------------------
           4️⃣ Defensive blocks (NEVER save garbage)
        ------------------------------------------------ */
        if (finalName && looksLikeGarbageName(finalName)) {
          await this.logIngestion(
            "WARN",
            "SUSPICIOUS_NAME",
            "Sanitized agent name still looks suspicious; blocked",
            propertyId,
            { finalName, candidateName: candidate.name }
          );
          finalName = null;
        }
      
        if (finalName && looksLikeFirm(finalName)) {
          await this.logIngestion(
            "WARN",
            "BLOCKED_FIRM_AS_NAME",
            "Firm-like string was blocked from being saved as agent name",
            propertyId,
            { finalName }
          );
          finalName = null;
        }
      
        /* ------------------------------------------------
           5️⃣ Informational logging (NOT errors)
        ------------------------------------------------ */
        if (!finalName) {
          await this.logIngestion(
            "INFO",
            "AGENT_WITHOUT_NAME",
            "Agent created using phone only",
            propertyId,
            { phones: candidate.phones }
          );
        }
      
        /* ------------------------------------------------
           6️⃣ Create agent (SOURCE OF TRUTH)
        ------------------------------------------------ */
        agent = await this.prisma.agent.create({
          data: {
            name: finalName,
            firmName: finalFirmName,
            phones: {
              create: candidate.phones.map((p) => ({ phone: p })),
            },
          },
        });
      }
       else {
        // ensure all phones are attached
        for (const phone of candidate.phones) {
          await this.prisma.agentPhone.upsert({
            where: { phone },
            update: { agentId: agent.id },
            create: {
              phone,
              agentId: agent.id,
            },
          });
        }
      }
      
  
      // link property
      await this.prisma.propertyAgent.upsert({
        where: {
          propertyId_agentId: {
            propertyId,
            agentId: agent.id,
          },
        },
        update: {},
        create: {
          propertyId,
          agentId: agent.id,
        },
      });
    }

    // ✅ Ingestion summary log
    await this.logIngestion(
      "INFO",
      "INGESTION_SUMMARY",
      "Property agent ingestion summary",
      propertyId,
      {
        candidates: candidates.length,
        totalPhones: candidates.reduce((sum, c) => sum + c.phones.length, 0),
      }
    );

    
  }
  
  async mergeAgents(sourceId: string, targetId: string, user: string) {
    if (sourceId === targetId) throw new Error("Same agent");
  
    await this.prisma.$transaction(async (tx) => {
      const source = await tx.agent.findUnique({
        where: { id: sourceId },
        include: { phones: true },
      });
  
      const target = await tx.agent.findUnique({
        where: { id: targetId },
      });
  
      if (!source || !target) throw new Error("Agent not found");
  
      if (source.isMerged) throw new Error("Source already merged");
  
      // 1️⃣ Move phones
      for (const p of source.phones) {
        await tx.agentPhone.upsert({
          where: { phone: p.phone },
          update: { agentId: targetId },
          create: { phone: p.phone, agentId: targetId },
        });
      }
  
      // 2️⃣ Move property links
      await tx.propertyAgent.updateMany({
        where: { agentId: sourceId },
        data: { agentId: targetId },
      });
  
      // 3️⃣ Mark source as merged
      await tx.agent.update({
        where: { id: sourceId },
        data: {
          isMerged: true,
          mergedIntoId: targetId,
          mergedAt: new Date(),
        },
      });
  
      // 4️⃣ Log merge
      await tx.agentMergeLog.create({
        data: {
          fromAgentId: sourceId,
          toAgentId: targetId,
          mergedBy: user,
          reason: "Manual merge via UI",
        },
      });
    });

    
  }
  
  private hydrateAgents(p: any) {
  const agents =
    p.propertyAgents?.map((pa: any) => ({
      id: pa.agent.id,
      name: pa.agent.name,
      isMerged: pa.agent.isMerged,

      // ✅ FIX: preserve object shape
      phones: (pa.agent.phones || []).map((ph: any) => ({
        phone: ph.phone,
      })),
    })) || [];

  // 🔥 firm comes from ANY agent (all same by rule)
  const firmName =
    p.propertyAgents?.[0]?.agent?.firmName || null;

  return {
    ...p,
    firmName,
    agents,
  };
}


  async attachAgent(propertyId: string, agentId: string) {
    await this.prisma.propertyAgent.upsert({
      where: {
        propertyId_agentId: {
          propertyId,
          agentId,
        },
      },
      update: {},
      create: {
        propertyId,
        agentId,
      },
    });
  
    return { success: true };
  }
  

  

  // ================= DASHBOARD =================

  async findAll(query: any) {
    console.log("🧪 RAW QUERY =", query);
    const where: Prisma.PropertyWhereInput = {};


    /* ---------------- DATE FILTER ---------------- */

    const dateRange = resolveDateRange(query);

    if (dateRange) {
      where.createdAt = dateRange;
    }


    /* ---------------- BASIC FILTERS ---------------- */

    if (query.listingType) {
      where.listingType = query.listingType;
    }

    if (query.propertyCategory) {
      where.propertyCategory = query.propertyCategory;
    }

    /* ---------------- SMART SEARCH (q) ---------------- */

    if (query.q) {
      where.OR = [
        { city: { contains: query.q, mode: "insensitive" } },
        { area: { contains: query.q, mode: "insensitive" } },
        { building: { contains: query.q, mode: "insensitive" } },
        { location: { contains: query.q, mode: "insensitive" } },
      ];
    }

    /* ---------------- PRICE ---------------- */

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = BigInt(query.minPrice);
      if (query.maxPrice) where.price.lte = BigInt(query.maxPrice);
    }

    /* ---------------- BHK (multi) ---------------- */

    const bhk = parseCsv(query.bhk);
    if (bhk.length > 0) {
      where.bhk = { in: bhk };
    }

    /* ---------------- FURNISHING (multi) ---------------- */

    const furnishing = parseCsv(query.furnishing);
    if (furnishing.length > 0) {
      where.furnishing = { in: furnishing as any };
    }

    /* ---------------- TENANT TYPES ---------------- */

    const tenantTypes = parseCsv(query.tenantTypes);
    if (tenantTypes.length > 0) {
      where.tenantTypes = {
        hasSome: tenantTypes as any,
      };
    }

    /* ---------------- TENANT RESTRICTIONS ---------------- */

    const tenantRestrictions = parseCsv(query.tenantRestrictions);
    if (tenantRestrictions.length > 0) {
      where.tenantRestrictions = {
        hasSome: tenantRestrictions,
      };
    }

    if (query.leadView === "open") {
      where.leadStage = { notIn: ["CLOSED", "LOST"] };
    }

    if (query.leadView === "closed") {
      where.leadStage = "CLOSED";
    }

    if (query.leadView === "followups") {
      const start = new Date();
      start.setHours(0,0,0,0);

      const end = new Date();
      end.setHours(23,59,59,999);

      where.followUpAt = { gte: start, lte: end };
      where.leadStage = { notIn: ["CLOSED", "LOST"] };
    }

    if (query.smart === 'urgent') {
      where.urgencyLevel = {
        in: [UrgencyLevel.URGENT, UrgencyLevel.VERY_URGENT],
      };
      where.status = PropertyStatus.APPROVED;
    }

    if (query.smart === 'review') {
      where.status = PropertyStatus.REVIEW;
    }
    

    if (query.status && query.status !== '') {
      where.status = query.status;
    }

    if (query.availability) where.availability = query.availability;

    if (query.location)
      where.location = { contains: query.location, mode: 'insensitive' };

    if (query.area)
      where.area = { contains: query.area, mode: 'insensitive' };

    if (query.building)
      where.building = { contains: query.building, mode: 'insensitive' };

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = BigInt(query.minPrice);
      if (query.maxPrice) where.price.lte = BigInt(query.maxPrice);
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };

    // 🔥 BROKER-LEVEL SORTS
    if (query.sort === 'urgent') {
      orderBy = [
        { urgencyLevel: 'desc' },
        { createdAt: 'desc' },
      ];
    }

    else if (query.sort === 'most_shared') {
      orderBy = {
        shares: {
          _count: 'desc',
        },
      };
    }

    else if (query.sortBy) {
      orderBy = {
        [query.sortBy]: query.sortOrder || 'desc',
      };
    }


    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          shares: true,
          propertyAgents: {
            include: {
              agent: {
                include: {
                  phones: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const enriched = items.map((p) => {
      p = this.hydrateAgents(p);   
      const leads = p.shares || [];
  
      const openLeads = leads.filter(
        (l) => l.leadStage !== 'CLOSED' && l.leadStage !== 'LOST'
      );
  
      const due = openLeads.filter(
        (l) => l.followUpAt && new Date(l.followUpAt) <= today
      );
  
      const overdue = openLeads.filter(
        (l) => l.followUpAt && new Date(l.followUpAt) < today
      );
  
      return {
        ...p,
        leadsCount: leads.length,
        dueFollowUpsCount: due.length,
        overdueFollowUpsCount: overdue.length,
      };
    });

    // function hydrateAgents(p: any) {
    //   const agents =
    //     p.propertyAgents?.map((pa: any) => ({
    //       id: pa.agent.id,
    //       name: pa.agent.name,
    //       firmName: pa.agent.firmName,
    //       phones: pa.agent.phones.map((ph: any) => ph.phone),
    //     })) || [];
    
    //   return {
    //     ...p,
    
    //     // 🔥 legacy fields UI expects
    //     agentName: agents[0]?.name || null,
    //     firmName: agents[0]?.firmName || null,
    //     agentPhones: agents[0]?.phones || [],
    
    //     // ✅ future-proof structured data
    //     agents,
    //   };
    // }
    

    return {
      items: enriched,   // ✅ RETURN ENRICHED
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const p = await this.prisma.property.findUnique({
      where: { id },
      include: {
        propertyAgents: {
          include: {
            agent: {
              include: {
                phones: true,
              },
            },
          },
        },
      },
    });
    if (!p) return null;

    return this.hydrateAgents(p); // ✅ THIS WAS MISSING
  }

  private async logIngestion(
    level: "INFO" | "WARN" | "ERROR",
    code: string,
    message: string,
    propertyId?: string,
    payload?: any
  ) {
    await this.prisma.ingestionLog.create({
      data: {
        level,
        code,
        message,
        propertyId: propertyId || null,
        payload: payload || undefined,
      },
    });
  }

  // async shareProperty(
  //   propertyId: string,
  //   body: {
  //     platform: 'WHATSAPP';
  //     clientName?: string;
  //     clientPhone: string;
  //     teamMemberIds: string[];
  //   },
  // ) {
  //   console.log("🚨 SHARE ENDPOINT HIT", { propertyId, body });
  //   const phone = body.clientPhone.replace(/\D/g, '');
  
  //   // 1️⃣ UPSERT CLIENT
  //   const client = await this.prisma.client.upsert({
  //     where: { phone },
  //     update: {
  //       name: body.clientName || undefined,
  //     },
  //     create: {
  //       name: body.clientName || null,
  //       phone,
  //     },
  //   });
  
  //   // 2️⃣ UPSERT CLIENT ↔ PROPERTY (THIS IS YOUR CRM)
  //   const clientProperty = await this.prisma.clientProperty.upsert({
  //     where: {
  //       clientId_propertyId: {
  //         clientId: client.id,
  //         propertyId,
  //       },
  //     },
  //     update: {
  //       lastContactedAt: new Date(),
  //     },
  //     create: {
  //       clientId: client.id,
  //       propertyId,
  //       lastContactedAt: new Date(),
  //     },
  //   });
  
  //   // 3️⃣ LOG SHARE (ACTIVITY, NOT CRM)
  //   const lead = await this.prisma.propertyShare.create({
  //     data: {
  //       propertyId,
  //       platform: body.platform,
  //       targetType: 'PERSON',
  //       targetName: body.clientName,
  //       targetContact: phone,
  //     },
  //   });
  
  //   // 4️⃣ ACTIVITY LOG
  //   await this.prisma.propertyActivity.create({
  //     data: {
  //       propertyId,
  //       action: 'PROPERTY_SHARED',
  //       newData: {
  //         leadId: lead.id,
  //         clientId: client.id,
  //         clientPropertyId: clientProperty.id,
  //       },
  //     },
  //   });
  
  //   return {
  //     success: true,
  //     clientId: client.id,
  //     leadId: lead.id,
  //   };
  // }  

  async shareProperty(
  propertyId: string,
  body: {
    platform: 'WHATSAPP';
    clientName?: string;
    clientPhone: string;
    teamMemberIds: string[];
  },
) {
  console.log("🚨 shareProperty HIT", { propertyId, body });

  try {
    const phone = body.clientPhone.replace(/\D/g, '');
    console.log("📞 normalized phone =", phone);

    // 1️⃣ UPSERT CLIENT
    const client = await this.prisma.client.upsert({
      where: { phone },
      update: {
        name: body.clientName || undefined,
      },
      create: {
        name: body.clientName || null,
        phone,
      },
    });
    console.log("✅ client =", client.id);

    // 2️⃣ UPSERT CLIENT ↔ PROPERTY
    const clientProperty = await this.prisma.clientProperty.upsert({
      where: {
        clientId_propertyId: {
          clientId: client.id,
          propertyId,
        },
      },
      update: {
        lastContactedAt: new Date(),
      },
      create: {
        clientId: client.id,
        propertyId,
        lastContactedAt: new Date(),
      },
    });
    console.log("✅ clientProperty =", clientProperty.id);

    // 3️⃣ CREATE PROPERTY SHARE
    const lead = await this.prisma.propertyShare.create({
      data: {
        propertyId,
        platform: body.platform,
        targetType: 'PERSON',
        targetName: body.clientName,
        targetContact: phone,
      },
    });
    console.log("✅ propertyShare =", lead.id);

    // 4️⃣ ACTIVITY LOG
    await this.prisma.propertyActivity.create({
      data: {
        propertyId,
        action: 'PROPERTY_SHARED',
        newData: {
          leadId: lead.id,
          clientId: client.id,
          clientPropertyId: clientProperty.id,
        },
      },
    });

    return {
      success: true,
      clientId: client.id,
      leadId: lead.id,
    };
  } catch (err) {
    console.error("❌ shareProperty FAILED", err);
    throw err; // VERY IMPORTANT
  }
}

  
  
  
  
  

  // ================= UPDATE =================

  async update(id: string, dto: any) {
    const old = await this.prisma.property.findUnique({ where: { id } });
    if (!old) throw new NotFoundException('Property not found');

    const data: any = { ...dto };

    if (dto.followUpAt !== undefined) {
      data.followUpAt = dto.followUpAt ? new Date(dto.followUpAt) : null;
    }

    if (dto.lastContactedAt !== undefined) {
      data.lastContactedAt = dto.lastContactedAt
        ? new Date(dto.lastContactedAt)
        : null;
    }

    // ---------------- EXTRA FIELD CONVERSIONS ----------------

    if (dto.availableFrom !== undefined) {
      data.availableFrom = dto.availableFrom
        ? new Date(dto.availableFrom)
        : null;
    }

    if (dto.negotiable !== undefined) {
      data.negotiable = dto.negotiable === null
        ? null
        : Boolean(dto.negotiable);
    }

    if (dto.areaSqft !== undefined) {
      data.areaSqft = dto.areaSqft !== null
        ? Number(dto.areaSqft)
        : null;
    }

    if (dto.price !== undefined)
      data.price = dto.price ? BigInt(dto.price) : null;
    if (dto.deposit !== undefined)
      data.deposit = dto.deposit ? BigInt(dto.deposit) : null;

      const nullableFields = [
        'listingType',
        'propertyCategory',
        'propertySubType',
        'country',
        'city',
        'area',
        'location',
        'building',
        'bhk',
        'areaSqft',
        'furnishing',
        'floor',
        'totalFloors',
        'urgencyLevel',
        'status',
        'availability',
        'notes',
      ];
      

    for (const key of nullableFields) {
      if (data[key] === '') data[key] = null;
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data,
    });

    await this.prisma.propertyActivity.create({
      data: {
        propertyId: id,
        action: 'UPDATED',
        oldData: old as any,
        newData: updated as any,
        userName: 'Dipanshu (Admin)',
      },
    });

    return updated;
  }

  // ================= STATUS =================

  async updateStatus(id: string, status: PropertyStatus) {
    const before = await this.prisma.property.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({
      where: { id },
      data: { status },
    });

    await this.prisma.propertyActivity.create({
      data: {
        propertyId: id,
        action: status,
        oldData: before as any,
        newData: updated as any,
        userName: 'Dipanshu (Admin)',
      },
    });

    return updated;
  }

  // async updateLead(id: string, dto: { leadStage?: any; followUpAt?: string | null; notes?: string | null }) {
  //   const existing = await this.prisma.property.findUnique({
  //     where: { id },
  //   });
  
  //   if (!existing) {
  //     throw new Error('Property not found');
  //   }
  
  //   const oldData = {
  //     leadStage: existing.leadStage,
  //     followUpAt: existing.followUpAt,
  //     notes: (existing as any).notes,
  //     lastContactedAt: existing.lastContactedAt,
  //   };
  
  //   const updateData: any = {
  //     leadStage: dto.leadStage ?? existing.leadStage,
  //     followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
  //   };
  
  //   // If stage becomes CONTACTED, update lastContactedAt
  //   if (dto.leadStage === 'CONTACTED') {
  //     updateData.lastContactedAt = new Date();
  //   }
  
  //   // ⚠️ Only if you have notes column
  //   if ('notes' in dto) {
  //     updateData.notes = dto.notes;
  //   }
  
  //   const updated = await this.prisma.property.update({
  //     where: { id },
  //     data: updateData,
  //   });
  
  //   // 🧾 Activity log
  //   await this.prisma.propertyActivity.create({
  //     data: {
  //       propertyId: id,
  //       action: 'LEAD_UPDATED',
  //       oldData,
  //       newData: {
  //         leadStage: updated.leadStage,
  //         followUpAt: updated.followUpAt,
  //         notes: (updated as any).notes,
  //         lastContactedAt: updated.lastContactedAt,
  //       },
  //     },
  //   });
  
  //   return updated;
  // }

  //Get leads
  async getLeads(propertyId: string) {
    return this.prisma.propertyShare.findMany({
      where: { propertyId },
      orderBy: { sentAt: 'desc' },
    });
  }

  //2️⃣ Create lead (manual)
  async createLead(propertyId: string, dto: { name?: string; phone?: string }) {
    const lead = await this.prisma.propertyShare.create({
      data: {
        propertyId,
        platform: 'MANUAL',
        targetType: 'PERSON',
        targetName: dto.name,
        targetContact: dto.phone,
      },
    });
  
    // 🧾 Activity log
    await this.prisma.propertyActivity.create({
      data: {
        propertyId,
        action: 'LEAD_CREATED',
        newData: lead,
      },
    });
  
    return lead;
  }

  //3️⃣ Update lead workflow
  async updateLead(
    leadId: string,
    dto: { leadStage?: any; followUpAt?: string | null; notes?: string | null },
  ) {
    const existing = await this.prisma.propertyShare.findUnique({
      where: { id: leadId },
    });
  
    if (!existing) {
      throw new Error('Lead not found');
    }
  
    const updateData: any = {
      leadStage: dto.leadStage ?? existing.leadStage,
      followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
      notes: dto.notes ?? existing.notes,
    };
  
    if (dto.leadStage === 'CONTACTED') {
      updateData.lastContactedAt = new Date();
    }
  
    const updated = await this.prisma.propertyShare.update({
      where: { id: leadId },
      data: updateData,
    });
  
    // 🧾 Activity log (still attached to PROPERTY, not lead)
    await this.prisma.propertyActivity.create({
      data: {
        propertyId: existing.propertyId,
        action: 'LEAD_UPDATED',
        oldData: existing,
        newData: updated,
      },
    });
  
    return updated;
  }

  

  // ================= DELETE =================

  async delete(id: string) {
    return this.prisma.property.delete({ where: { id } });
  }

  // ================= ACTIVITY =================

  async getActivities(propertyId: string) {
    return this.prisma.propertyActivity.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            message: {
              select: {
                rawText: true,
                groupName: true,
              },
            },
          },
        },
      },
    });
  }
  
  

  async revertToActivity(propertyId: string, activityId: string) {
    const activity = await this.prisma.propertyActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity || !activity.oldData) {
      throw new Error('No version to revert to');
    }

    const before = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    const reverted = await this.prisma.property.update({
      where: { id: propertyId },
      data: activity.oldData as any,
    });

    await this.prisma.propertyActivity.create({
      data: {
        propertyId,
        action: 'REVERTED',
        oldData: before as any,
        newData: reverted as any,
        userName: 'Dipanshu (Admin)',
      },
    });

    

    return reverted;
  }

  // private async attachAgentsToProperty(
  //   propertyId: string,
  //   contacts: string[],
  //   senderContact: string | null,
  //   agentName: string | null,
  //   firmName: string | null,
  // ) {
  //   const phonesFromMessage = new Set<string>();
  
  //   for (const c of contacts || []) {
  //     const p = normalizePhone(c);
  //     if (p) phonesFromMessage.add(p);
  //   }
  
  //   let phonesToUse: string[] = [];
  
  //   if (phonesFromMessage.size > 0) {
  //     phonesToUse = Array.from(phonesFromMessage);
  //   } else {
  //     const sender = normalizePhone(senderContact || "");
  //     if (sender) phonesToUse = [sender];
  //   }
  
  //   for (const phone of phonesToUse) {
  //     // find agent by phone
  //     let agentPhone = await this.prisma.agentPhone.findUnique({
  //       where: { phone },
  //       include: { agent: true },
  //     });
  
  //     let agent;
  
  //     if (!agentPhone) {
  //       agent = await this.prisma.agent.create({
  //         data: {
  //           name: agentName || null,
  //           firmName: firmName || null,
  //           phones: {
  //             create: { phone },
  //           },
  //         },
  //       });
  //     } else {
  //       agent = agentPhone.agent;
  //     }
  
  //     // link property <-> agent
  //     await this.prisma.propertyAgent.upsert({
  //       where: {
  //         propertyId_agentId: {
  //           propertyId,
  //           agentId: agent.id,
  //         },
  //       },
  //       update: {},
  //       create: {
  //         propertyId,
  //         agentId: agent.id,
  //       },
  //     });
  //   }
  // }
  

  // ================= CRM LISTS =================

  async getFollowUpsToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
  
    return this.prisma.propertyShare.findMany({
      where: {
        followUpAt: {
          gte: today,
          lt: tomorrow,
        },
        leadStage: {
          notIn: ['CLOSED', 'LOST'],
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        followUpAt: 'asc',
      },
    });
  }
  
  async getOverdueFollowUps() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    return this.prisma.propertyShare.findMany({
      where: {
        followUpAt: {
          lt: today,
        },
        leadStage: {
          notIn: ['CLOSED', 'LOST'],
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        followUpAt: 'asc',
      },
    });
  }
  
  async getOpenLeads() { return []; }
  async getClosedLeads() { return []; }
  async getPropertyWithDistribution(id: string) {
    const p = await this.prisma.property.findUnique({
      where: { id },
      include: {
        message: {
          select: {
            rawText: true,
            groupName: true,
          },
        },
        shares: true,
        propertyAgents: {
          include: {
            agent: {
              include: { phones: true },
            },
          },
        },
      },
    });
    
  
    if (!p) return null;
    return this.hydrateAgents(p);
  }  

  async getAllLeads(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;
  
    const [items, total] = await Promise.all([
      this.prisma.propertyShare.findMany({
        skip,
        take: limit,
        orderBy: [
          { followUpAt: 'asc' },
          { sentAt: 'desc' },
        ],
        include: {
          property: {
            select: {
              id: true,
              listingType: true,
              propertySubType: true,
              bhk: true,
              area: true,
              city: true,
            },
          },
        },
      }),
      this.prisma.propertyShare.count(),
    ]);
  
    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }  

  async attachAgentByPhone(propertyOrMessageId: string, rawPhone: string) {
    if (!rawPhone) {
      throw new BadRequestException('PHONE_REQUIRED');
    }
  
    const phone = normalizeIndianPhone(rawPhone);
  
    const agent = await this.prisma.agent.findFirst({
      where: {
        phones: { some: { phone } },
      },
      select: { id: true },
    });
  
    if (!agent) {
      throw new NotFoundException('AGENT_NOT_FOUND');
    }
  
    const property = await this.prisma.property.findFirst({
      where: {
        OR: [
          { id: propertyOrMessageId },
          { messageId: propertyOrMessageId },
        ],
      },
      select: { id: true },
    });
  
    if (!property) {
      throw new NotFoundException('PROPERTY_NOT_FOUND');
    }
  
    await this.prisma.propertyAgent.upsert({
      where: {
        propertyId_agentId: {
          propertyId: property.id,
          agentId: agent.id,
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        agentId: agent.id,
      },
    });
  
    return { success: true };
  }
  
  async detachAgent(propertyOrMessageId: string, agentId: string) {
    /* ---------------------------------------------------
       1️⃣ Resolve canonical Property.id
    --------------------------------------------------- */
    const property = await this.prisma.property.findFirst({
      where: {
        OR: [
          { id: propertyOrMessageId },
          { messageId: propertyOrMessageId },
        ],
      },
      select: { id: true },
    });
  
    if (!property) {
      throw new NotFoundException('PROPERTY_NOT_FOUND');
    }
  
    /* ---------------------------------------------------
       2️⃣ Delete relation ONLY (safe)
    --------------------------------------------------- */
    await this.prisma.propertyAgent.delete({
      where: {
        propertyId_agentId: {
          propertyId: property.id,
          agentId,
        },
      },
    });
  
    return {
      success: true,
      propertyId: property.id,
      agentId,
    };
  }

  

  async createManualProperty(payload: {
    method: 'FORM' | 'TEXT';
    propertyData?: any;
    rawText?: string;
    source: {
      type: string;
      contactNumber: string;
      name?: string;
      firmName?: string;
    };
  }) {
    const { method, propertyData, rawText, source } = payload;
  
    if (!source?.contactNumber) {
      throw new Error('Contact number is mandatory');
    }
  
    /* ---------------------------------------------
       1️⃣ BUILD SOURCE CONTEXT (WHATSAPP-LIKE)
    --------------------------------------------- */
  
    const buildSourceBlock = () => {
      return [
        'SOURCE:',
        `Source Type: ${source.type}`,
        source.name ? `Broker Name: ${source.name}` : null,
        source.firmName ? `Firm Name: ${source.firmName}` : null,
        `Mobile: ${source.contactNumber}`,
        '',
        'PROPERTY DETAILS:',
      ]
        .filter(Boolean)
        .join('\n');
    };
  
    /* ---------------------------------------------
       2️⃣ BUILD RAW TEXT (TEXT & FORM UNIFIED)
    --------------------------------------------- */
  
    let detailsText = '';
  
    if (method === 'TEXT') {
      if (!rawText || rawText.trim() === '') {
        throw new Error('Raw text is required for TEXT mode');
      }
      detailsText = rawText.trim();
    }
  
    if (method === 'FORM') {
      if (!propertyData) {
        throw new Error('propertyData is required for FORM mode');
      }
  
      // 🔥 Convert structured form data → human-readable text
      // This is CRITICAL so AI remains the single brain
      detailsText = Object.entries(propertyData)
        .map(([key, value]) => {
          if (value === null || value === undefined || value === '') return null;
          return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join('\n');
    }
  
    const combinedRawText = [
      buildSourceBlock(),
      detailsText,
    ].join('\n\n');
  
    /* ---------------------------------------------
       3️⃣ CREATE MESSAGE (SAME AS WHATSAPP)
    --------------------------------------------- */
  
    const messageId = `manual-${Date.now()}`;
  
    await this.prisma.message.create({
      data: {
        id: messageId,
        groupName: 'MANUAL',
        messageKey: messageId,
        rawText: combinedRawText,
      },
    });
  
    /* ---------------------------------------------
       4️⃣ AI PARSING (SINGLE SOURCE OF TRUTH)
    --------------------------------------------- */
  
    const aiResult = await this.aiParserService.parseMessage(combinedRawText);
    
  
    if (!aiResult) {
      throw new Error('AI failed to parse manual property text');
    }
  
    /* ---------------------------------------------
       5️⃣ REUSE EXISTING INGESTION PIPELINE
    --------------------------------------------- */
  
    await this.createFromAi(
      messageId,
      aiResult,
      normalizePhone(source.contactNumber)
    );
  
    return { success: true };
  }
  
  
  
}

//////////////////////////
// 🔁 SANITIZERS
//////////////////////////

function sanitizeTenantTypes(v: any): TenantType[] {
  if (!Array.isArray(v)) return [TenantType.ANY];
  const allowed = Object.values(TenantType);
  const out = v.filter((x) => allowed.includes(x));
  if (out.length === 0) return [TenantType.ANY];
  return out as TenantType[];
}

function sanitizeTenantRestrictions(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => ALLOWED_RESTRICTION_CODES.has(x));
}

//////////////////////////
// 🔁 HELPERS
//////////////////////////

// (rest helpers unchanged from your file)


//////////////////////////
// 🔁 MAPPERS & HELPERS
//////////////////////////

// function extractNameForPhone(rawText: string, phone: string): string | null {
//   if (!rawText) return null;

//   const lines = rawText.split(/\r?\n/);

//   for (const line of lines) {
//     if (line.includes(phone.slice(-5))) {
//       // remove phone number from line
//       const cleaned = line.replace(/\+?\d[\d\s\-]{8,}/g, "").trim();

//       // remove junk words
//       const name = cleaned
//         .replace(/call|contact|only|:-|for|on/gi, "")
//         .trim();

//       if (name.length >= 3 && name.length <= 50) {
//         return name;
//       }
//     }
//   }

//   return null;
// }



function mapListingType(v: any): ListingType | null {
  if (v === 'RENT') return ListingType.RENT;
  if (v === 'SALE') return ListingType.SALE;
  return null;
}

function mapPropertyCategory(v: any): PropertyCategory | null {
  if (v === 'RESIDENTIAL') return PropertyCategory.RESIDENTIAL;
  if (v === 'COMMERCIAL') return PropertyCategory.COMMERCIAL;
  return null;
}

function mapPropertySubType(v: any): PropertySubType {
  if (Object.values(PropertySubType).includes(v)) return v;
  return PropertySubType.OTHER;
}

function mapFurnishing(v: any): FurnishingType | null {
  if (v === 'UNFURNISHED') return FurnishingType.UNFURNISHED;
  if (v === 'SEMI_FURNISHED') return FurnishingType.SEMI_FURNISHED;
  if (v === 'FULLY_FURNISHED') return FurnishingType.FULLY_FURNISHED;
  return null;
}

function mapUrgency(v: any): UrgencyLevel {
  if (v === 'VERY_URGENT') return UrgencyLevel.VERY_URGENT;
  if (v === 'URGENT') return UrgencyLevel.URGENT;
  return UrgencyLevel.NORMAL;
}

function mapPreferences(arr: any[]): TenantPreference[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((v) => Object.values(TenantPreference).includes(v));
}

function normalizeContacts(input: string[]): string[] {
  const all: string[] = [];

  for (const raw of input || []) {
    const matches = raw.match(/\+?\d[\d\s\-]{8,}/g);
    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/\D/g, '');
        if (clean.length >= 10) all.push(clean);
      }
    }
  }

  return Array.from(new Set(all));
}

function extractIndianPhone(jid: string | null): string | null {
  if (!jid) return null;

  const beforeAt = jid.split('@')[0];
  const numberPart = beforeAt.split(':')[0];

  if (!/^\d+$/.test(numberPart)) return null;

  if (numberPart.length === 10) return numberPart;
  if (numberPart.length === 12 && numberPart.startsWith('91'))
    return numberPart.slice(2);

  return null;
}

function normalizeBhk(input: any): string | null {
  if (!input) return null;

  const text = String(input).toLowerCase();

  if (text.includes('studio')) return 'Studio';
  if (text.includes('rk')) return '1RK';

  const match = text.match(/\d+/);
  if (!match) return null;

  const n = parseInt(match[0], 10);
  if (isNaN(n) || n <= 0 || n > 20) return null;

  return `${n}BHK`;
}

function normalizePhone(input: string): string | null {
  if (!input) return null;

  let digits = input.replace(/\D/g, "");

  if (digits.length > 10) digits = digits.slice(-10);

  if (digits.length !== 10) return null;

  return digits;
}


function looksLikeLocationRangeOrHeader(name: string): boolean {
  const n = name.toLowerCase();

  // contains "to" between places
  if (n.includes(" to ")) return true;

  // contains multiple area keywords
  const areaWords = [
    "andheri","bandra","borivali","kandivali","malad","goregaon","jogeshwari",
    "west","east","road","nagar","sv","link"
  ];

  let hits = 0;
  for (const w of areaWords) {
    if (n.includes(w)) hits++;
  }

  if (hits >= 2) return true;

  // marketing words
  if (
    n.includes("flat") ||
    n.includes("bhk") ||
    n.includes("out") ||
    n.includes("deal")
  ) return true;

  return false;
}

function sanitizeHumanName(input: string): string | null {
  if (!input) return null;

  let s = input.trim();

  // ----------------------------------
  // Remove emojis & symbols
  // ----------------------------------
  s = s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, " ");
  s = s.replace(/[*_~•👉🏻👉📲📞]+/g, " ");

  // ----------------------------------
  // Remove phone numbers if present
  // ----------------------------------
  s = s.replace(/\+?\d[\d\s\-]{8,}/g, " ");

  // ----------------------------------
  // Remove honorifics ONLY (safe list)
  // ----------------------------------
  const honorifics = [
    "mr", "mr.", "mrs", "mrs.", "ms", "ms.",
    "shri", "shree", "smt", "kumari",
    "sir", "madam"
  ];

  s = s
    .split(/\s+/)
    .filter(word => !honorifics.includes(word.toLowerCase()))
    .join(" ");

  // ----------------------------------
  // Normalize dots in initials (M.K → M K)
  // ----------------------------------
  s = s.replace(/\./g, " ");

  // ----------------------------------
  // Cleanup spaces & punctuation
  // ----------------------------------
  s = s.replace(/[-,–—:]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  if (!s) return null;

  // ----------------------------------
  // Normalize casing (ALL CAPS → Title Case)
  // ----------------------------------
  s = s
    .toLowerCase()
    .split(" ")
    .map(w => w.length === 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return s;
}


function isValidHumanName(name: string): boolean {
  if (!name) return false;

  const raw = name.trim();
  const lower = raw.toLowerCase();

  // ----------------------------------
  // Hard rejections (labels / junk)
  // ----------------------------------
  const blockedExact = new Set([
    "-", "name", "agent", "broker",
    "mobile", "phone", "contact",
    "call", "number", "whatsapp"
  ]);

  if (blockedExact.has(lower.replace(":", ""))) return false;

  // ----------------------------------
  // Length bounds (practical)
  // ----------------------------------
  if (raw.length < 3 || raw.length > 50) return false;

  // ----------------------------------
  // Digits NOT allowed in names
  // ----------------------------------
  if (/\d/.test(raw)) return false;

  // ----------------------------------
  // Location / building keywords
  // ----------------------------------
  const nonHumanKeywords = [
    "building","tower","block","society","residency",
    "apartment","apartments","complex","heights",
    "plaza","road","street","lane","nagar","sector",
    "phase","near","opp","opposite","behind","metro",
    "property","properties","realty","estate","brokerage"
  ];

  if (nonHumanKeywords.some(w => lower.includes(w))) return false;

  // ----------------------------------
  // Structure rules
  // ----------------------------------
  const parts = raw.split(/\s+/);

  // Allow: 1–4 parts (Indian names + initials)
  if (parts.length < 1 || parts.length > 4) return false;

  for (const p of parts) {
    // Allow:
    // - Single letter initials (M, K)
    // - Normal words (Singh, Kumar, Chaudhary)
    if (!/^[A-Z][a-z]*$/.test(p)) return false;
  }

  return true;
}



function parseCsv(v: any): string[] {
  if (!v || typeof v !== "string") return [];
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

function resolveDateRange(query: {
  datePreset?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const now = new Date();

  // Always normalize to start/end of day (IST-safe)
  function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  // ---------- PRESETS ----------
  if (query.datePreset) {
    const end = endOfDay(now);
    const start = new Date(end);

    switch (query.datePreset) {
      case 'TODAY':
        return {
          gte: startOfDay(now),
          lte: end,
        };

      case 'LAST_7_DAYS':
        start.setDate(start.getDate() - 6);
        return { gte: startOfDay(start), lte: end };

      case 'LAST_14_DAYS':
        start.setDate(start.getDate() - 13);
        return { gte: startOfDay(start), lte: end };

      case 'LAST_30_DAYS':
        start.setDate(start.getDate() - 29);
        return { gte: startOfDay(start), lte: end };
    }
  }

  // ---------- CUSTOM RANGE ----------
  if (query.fromDate) {
    const from = startOfDay(new Date(query.fromDate));
    const to = query.toDate
      ? endOfDay(new Date(query.toDate))
      : endOfDay(now); // till today

    return { gte: from, lte: to };
  }

  return null;
}
function normalizeIndianPhone(input: string) {
  const digits = input.replace(/\D/g, '');

  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);

  return digits.slice(-10);
}
