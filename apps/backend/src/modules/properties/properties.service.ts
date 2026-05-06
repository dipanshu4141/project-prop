import { Prisma, TenantType, LeadStage, ListingType, PropertyCategory, PropertySubType, FurnishingType, UrgencyLevel, PropertyStatus } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiParseResult, AiParserService } from '../../ai/property-parser/ai-parser/ai-parser.service';
import { looksLikeGarbageName } from '../../common/utils/nameSanitizer';
import { ALLOWED_RESTRICTION_CODES } from './tenantRules';
import { PreClassifiedResult } from '../messages/pre-classifier.service';



// const VALID_AVAILABILITY = ['AVAILABLE', 'UNDER_NEGOTIATION', 'CLOSED', 'ON_HOLD'] as const;

// // function toAvailability(raw?: string | null): AvailabilityStatus {
// //   return (VALID_AVAILABILITY.includes(raw as AvailabilityStatus)
// //     ? raw
// //     : 'AVAILABLE') as AvailabilityStatus;
// // }
@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);
  
  constructor(
    private prisma:          PrismaService,
    private aiParserService: AiParserService,
  ) {}
  
  /* ================================================================
   * AI INGEST
   * All data created here is scoped to the workspace.
   * ================================================================ */

  async createFromAi(
    workspaceId:   string,
    messageId:     string,
    aiResult:      AiParseResult,
    senderNumber?: string | null,
  ) {
    const cleanSender = extractIndianPhone(senderNumber || null);

    if (!aiResult || !Array.isArray(aiResult.properties)) return;

    const message = await this.prisma.message.findFirst({
      where: { id: messageId, workspaceId },
    });

    if (!message) {
      await this.logIngestion('ERROR', 'MESSAGE_NOT_FOUND', 'Message missing during ingestion', workspaceId, messageId);
      return;
    }

    const rawText      = message.rawText || '';
    const contactBlock = (aiResult as any).contactBlock || {};
    const aiContacts   = normalizeContacts(contactBlock.contacts || []);

    for (const item of aiResult.properties as any[]) {
      try {
        const tenantTypes        = sanitizeTenantTypes(item.tenantTypes);
        const tenantRestrictions = sanitizeTenantRestrictions(item.tenantRestrictions);

        // ── Resolve canonical ONCE per item ──
        // At the top of the for loop in createFromAi, add:
        const canonicalPropertyId = await this.resolveOrCreateCanonical(
          item, aiContacts, cleanSender,
        );

        // Check if this workspace already has a listing for this canonical property
        // This guards against the case where canonical dedup works but upsert key differs
        const existingListing = await this.prisma.workspaceListing.findFirst({
          where: {
            workspaceId,
            canonicalPropertyId,
          },
        });

        if (existingListing) {
          this.logger.log(`Skipping duplicate listing for canonical ${canonicalPropertyId}`);
          // Still attach agents in case new phones were found
          await this.attachAgentsToListing(workspaceId, existingListing.id, aiContacts, rawText, cleanSender, contactBlock.agentName, contactBlock.firmName);
          continue;
        }

        const listingData = {
          workspaceId,
          messageId,
          canonicalPropertyId,
          refCode:          await this.nextRefCode(workspaceId),
          lastActivityAt:   message.receivedAt,  
          listingType:      mapListingType(item.listingType),
          propertyCategory: mapPropertyCategory(item.propertyCategory),
          propertySubType:  mapPropertySubType(item.propertySubType),
          country:          item.country  || null,
          city:             item.city     || null,
          area:             item.area     || null,
          building:         item.building || null,
          location:         item.location || null,
          price:            item.price   ? BigInt(item.price)   : null,
          deposit:          item.deposit ? BigInt(item.deposit) : null,
          bhk:              normalizeBhk(item.bhk),
          areaSqft:         item.areaSqft || null,
          furnishing:       mapFurnishing(item.furnishing),
          urgencyLevel:     mapUrgency(item.urgencyLevel),
          tenantTypes,
          tenantRestrictions,
          firmName:         null,
          agentName:        null,
          contacts:         aiContacts,
          senderContact:    cleanSender,
          rawContactBlock:  JSON.stringify(contactBlock),
          confidence:       item.confidence || 0.0,
          status:           this.calculateStatus(item),
          availability:     'AVAILABLE',
        };

        // ── Upsert — safe against duplicate canonical+workspace pairs ──
        const created = await this.prisma.workspaceListing.upsert({
          where: {
            workspaceId_canonicalPropertyId: {
              workspaceId,
              canonicalPropertyId,
            },
          },
          // On duplicate: refresh price, urgency, status — leave everything else
          update: {
            price:        listingData.price        ?? undefined,
            urgencyLevel: listingData.urgencyLevel,
            status:       listingData.status,
            confidence:   listingData.confidence,
          },
          create: {
            ...listingData,
            availability: (listingData.availability ?? 'AVAILABLE') as import('@prisma/client').$Enums.AvailabilityStatus,
          },
        });

        // ── Attach agents ──
        await this.attachAgentsToListing(
          workspaceId,
          created.id,
          aiContacts,
          rawText,
          cleanSender,
          contactBlock.agentName || null,
          contactBlock.firmName  || null,
        );

        // ── Activity log ──
        this.logger.log(`🏠 New listing: ${created.refCode} | ${item.bhk ?? '—'} ${item.propertySubType ?? ''} | ${item.area ?? '—'}, ${item.city ?? '—'} | ws=${workspaceId}`);

        // ── Activity log ──
        await this.prisma.listingActivity.create({
          data: {
            listingId: created.id,
            action:    'CREATED',
            oldData:   Prisma.JsonNull,
            newData:   created as any,
            userName:  'System',
          },
        });

      } catch (err: any) {
        // Log the failed item but continue processing the rest of the properties
        this.logger.error(`Failed to create listing for item in message ${messageId}`, err?.message);
        await this.logIngestion(
          'ERROR',
          'LISTING_CREATE_FAILED',
          err?.message ?? 'Unknown error',
          workspaceId,
          messageId,
          { item: { city: item.city, area: item.area, propertySubType: item.propertySubType } },
        );
      }
    }
  }


  // ── REPLACE the createFromPreClassified method in properties.service.ts ───────
// The version generated earlier had wrong field names. Use this instead.

  async createFromPreClassified(
    data: PreClassifiedResult['extracted'],
    messageId: string,
    workspaceId: string,
  ): Promise<void> {
    // Use resolveOrCreateCanonical (already exists in this service)
    // Build a synthetic item that matches what resolveOrCreateCanonical expects
    const syntheticItem = {
      city:            null,
      area:            data.location ?? null,
      building:        null,
      bhk:             data.bhk ?? null,
      propertySubType: null,
      areaSqft:        null,
      listingType:     data.listingType ?? 'RENT',
    };

    const canonicalPropertyId = await this.resolveOrCreateCanonical(
      syntheticItem,
      data.phones,
      data.phones[0] ?? null,
    );

    // Check for existing listing on this canonical (same guard as createFromAi)
    const existingListing = await this.prisma.workspaceListing.findFirst({
      where: { workspaceId, canonicalPropertyId },
    });
    if (existingListing) {
      this.logger.log(`[REGEX] Skipping duplicate canonical ${canonicalPropertyId}`);
      return;
    }

    // Map furnishing: classifier returns 'FURNISHED' but schema uses 'FULLY_FURNISHED'
    const furnishingMap: Record<string, import('@prisma/client').FurnishingType> = {
      FURNISHED:      'FULLY_FURNISHED',
      SEMI_FURNISHED: 'SEMI_FURNISHED',
      UNFURNISHED:    'UNFURNISHED',
    };
    const furnishing = data.furnishing ? (furnishingMap[data.furnishing] ?? null) : null;

    // listingType: classifier may return 'REQUIREMENT' — schema only has RENT/SALE
    const listingType: import('@prisma/client').ListingType =
      data.listingType === 'SALE' ? 'SALE' : 'RENT';

    const refCode = await this.nextRefCode(workspaceId);

    await this.prisma.workspaceListing.create({
      data: {
        workspaceId,
        messageId,
        canonicalPropertyId,
        refCode,
        listingType,
        area:       data.location ?? null,   // best field available from classifier
        bhk:        data.bhk     ?? null,
        price:      data.price   ? BigInt(data.price) : null,
        furnishing: furnishing   ?? null,
        urgencyLevel: data.isUrgent ? 'URGENT' : 'NORMAL',
        // contacts stored as JSON array string — same pattern as createFromAi
        contacts:     data.phones,
        senderContact: data.phones[0] ?? null,
        confidence:   0.7,               // fixed mid-confidence for regex path
        status:       'REVIEW',          // always REVIEW — no AI verification
        availability: 'AVAILABLE',
      },
    });

    this.logger.log(`[REGEX] Created listing for canonical ${canonicalPropertyId} (no Gemini)`);
  }
  


  /* ─── Resolve or create the canonical property fingerprint ────────── */
  private async resolveOrCreateCanonical(
    item:     any,
    contacts: string[],
    sender:   string | null,
  ): Promise<string> {

    // Sort contacts so order doesn't matter
    const sortedPhones = [...contacts].sort().join('+');

    // Physical fingerprint — no sender, sorted phones as last resort
    const fingerprint = [
      (item.city            || '').toLowerCase().trim(),
      (item.area            || '').toLowerCase().trim(),
      (item.building        || '').toLowerCase().trim(),
      (item.bhk             || '').toLowerCase().trim(),
      (item.propertySubType || '').toLowerCase().trim(),
      String(item.areaSqft  || ''),
      (item.listingType     || '').toLowerCase(),
      sortedPhones,                // sorted so order-independent
    ]
      .join('|')
      .replace(/\s+/g, '-');

    if (!fingerprint.replace(/[\|\-\+]/g, '').trim()) {
      const cp = await this.prisma.canonicalProperty.create({
        data: { globalRefCode: await this.nextGlobalRefCode() },
      });
      return cp.id;
    }

    const existing = await this.prisma.canonicalProperty.findUnique({
      where: { fingerprint },
    });

    if (existing) {
      return existing.id;
      // listingCount is now computed from _count.listings — no manual increment needed
    }

     const created = await this.prisma.canonicalProperty.create({
      data: { fingerprint, globalRefCode: await this.nextGlobalRefCode() },
    });
    return created.id;
  }
  private async nextGlobalRefCode(): Promise<string> {
    const count = await this.prisma.canonicalProperty.count();
    const year  = new Date().getFullYear();
    return `PROP-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async nextRefCode(workspaceId: string): Promise<string> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId }, select: { slug: true },
    });
    const slug = workspace?.slug ?? workspaceId.slice(0, 8);
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ts   = Date.now().toString(36).toUpperCase();
    return `${slug}-${year}-${ts}${rand}`;
  }

  calculateStatus(item: any): PropertyStatus {
    if (!item.confidence || item.confidence < 0.6) return PropertyStatus.REVIEW;
    if (!item.price || !item.location || !item.area)  return PropertyStatus.REVIEW;
    return PropertyStatus.APPROVED;
  }

  /* ================================================================
   * AGENT ATTACHMENT — workspace-scoped
   * ================================================================ */

  private async attachAgentsToListing(
    workspaceId:   string,
    listingId:     string,
    aiContacts:    string[],
    rawText:       string,
    senderContact: string | null,
    agentName:     string | null,
    firmName:      string | null,
  ) {
    type Candidate = { name: string | null; firm: string | null; phones: string[] };

    let globalFirm: string | null = firmName;
    const candidates: Candidate[] = [];

    const lines = (rawText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let currentName:   string | null = null;
    let currentFirm:   string | null = null;
    let currentPhones: string[] = [];

    function flush() {
      if (currentPhones.length > 0) {
        candidates.push({ name: currentName, firm: currentFirm || globalFirm, phones: [...new Set(currentPhones)] });
      }
      currentName = null; currentFirm = null; currentPhones = [];
    }

    function phonesFromLine(line: string): string[] {
      const out: string[] = [];
      for (const m of line.match(/\+?\d[\d\s\-]{8,}/g) || []) {
        const p = normalizePhone(m);
        if (p) out.push(p);
      }
      return out;
    }

    for (const line of lines) {
      const phones = phonesFromLine(line);

      if (phones.length > 0) {
        const n = cleanName(line);

        if (n) {
          // This line has BOTH a name and a phone — it's a self-contained agent line
          // Always flush any previous candidate and start fresh
          if (currentPhones.length > 0) flush();
          currentName = n;   // ← name from same line ALWAYS wins
        }

        currentPhones.push(...phones);
        continue;
      }



      if (looksLikeFirm(line)) {
        if (currentPhones.length > 0) {
          currentFirm = line;
        } else {
          globalFirm = line;
          for (const c of candidates) if (!c.firm) c.firm = globalFirm;
        }
        continue;
      }

      const n = cleanName(line);
      if (n) {
        if (currentPhones.length > 0) flush();
        currentName = n;
      }
    }

    flush();

    // Fallback
    if (candidates.length === 0) {
      const phones = aiContacts.map(normalizePhone).filter(Boolean) as string[];
      if (phones.length > 0) candidates.push({ name: agentName, firm: firmName, phones });
      else if (senderContact) candidates.push({ name: agentName, firm: firmName, phones: [senderContact] });
    }

    if (candidates.length === 0) {
      await this.logIngestion('ERROR', 'NO_AGENT_FOUND', 'No agent after fallback', workspaceId, listingId);
    }

    for (const candidate of candidates) {
      // Find existing agent in THIS workspace by phone
      let agent: any = null;

      for (const phone of candidate.phones) {
        const found = await this.prisma.agentPhone.findFirst({
          where: { phone, agent: { workspaceId } },   // ← workspace-scoped
          include: { agent: true },
        });

        if (found) {
          agent = found.agent;
          if (
            agent.name &&
            candidate.name &&
            agent.name.toLowerCase() !== candidate.name.toLowerCase()
          ) {
            await this.logIngestion('WARN', 'NAME_CONFLICT', 'Phone seen with different names', workspaceId, listingId, { phone, existingName: agent.name, newName: candidate.name });
          }
          break;
        }
      }

      if (!agent) {
        let finalName: string | null = null;
        const cn = candidate.name ? sanitizeHumanName(candidate.name) : null;
        if (cn && isValidHumanName(cn)) {
          finalName = cn;
        } else {
          const an = agentName ? sanitizeHumanName(agentName) : null;
          if (an && isValidHumanName(an)) finalName = an;
        }

        if (finalName && looksLikeGarbageName(finalName)) finalName = null;
        if (finalName && looksLikeFirm(finalName))         finalName = null;

        agent = await this.prisma.agent.create({
          data: {
            workspaceId,                                // ← scoped
            name:     finalName,
            firmName: firmName && looksLikeFirm(firmName) ? firmName : null,
            phones:   { create: candidate.phones.map((p) => ({ phone: p })) },
          },
        });
      } else {
        // Ensure all phones attached
        for (const phone of candidate.phones) {
          await this.prisma.agentPhone.upsert({
            where:  { agentId_phone: { agentId: agent.id, phone } },
            update: {},
            create: { phone, agentId: agent.id },
          });
        }
      }

      // Link listing ↔ agent (was propertyAgent)
      await this.prisma.listingAgent.upsert({
        where:  { listingId_agentId: { listingId, agentId: agent.id } },
        update: {},
        create: { listingId, agentId: agent.id },
      });
    }

    await this.logIngestion('INFO', 'INGESTION_SUMMARY', 'Agent ingestion complete', workspaceId, listingId, {
      candidates: candidates.length,
    });
  }

  private hydrateAgents(p: any) {
    const agents = (p.listingAgents || []).map((la: any) => ({
      id:       la.agent.id,
      name:     la.agent.name,
      isMerged: la.agent.isMerged,
      phones:   (la.agent.phones || []).map((ph: any) => ({ phone: ph.phone })),
    }));
    const firmName = p.listingAgents?.[0]?.agent?.firmName || null;
    return { ...p, firmName, agents };
  }

  /* ================================================================
   * FIND ALL — workspace-scoped with full filter support
   * ================================================================ */

  async findAll(workspaceId: string, query: any) {
    const where: Prisma.WorkspaceListingWhereInput = {
      workspaceId,             // ← workspace guard — first and always
    };

    const dateRange = resolveDateRange(query);
    if (dateRange) where.createdAt = dateRange;

    if (query.listingType)      where.listingType      = query.listingType;
    if (query.propertyCategory) where.propertyCategory = query.propertyCategory;

    if (query.q) {
      where.OR = [
        { city:     { contains: query.q, mode: 'insensitive' } },
        { area:     { contains: query.q, mode: 'insensitive' } },
        { building: { contains: query.q, mode: 'insensitive' } },
        { location: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = BigInt(query.minPrice);
      if (query.maxPrice) where.price.lte = BigInt(query.maxPrice);
    }

    const bhk = parseCsv(query.bhk);
    if (bhk.length > 0) where.bhk = { in: bhk };

    const furnishing = parseCsv(query.furnishing);
    if (furnishing.length > 0) where.furnishing = { in: furnishing as any };

    const tenantTypes = parseCsv(query.tenantTypes);
    if (tenantTypes.length > 0) where.tenantTypes = { hasSome: tenantTypes as any };

    const tenantRestrictions = parseCsv(query.tenantRestrictions);
    if (tenantRestrictions.length > 0) where.tenantRestrictions = { hasSome: tenantRestrictions };

    if (query.status)       where.status       = query.status;
    if (query.availability) where.availability = query.availability;
    if (query.location)     where.location     = { contains: query.location, mode: 'insensitive' };
    if (query.area)         where.area         = { contains: query.area,     mode: 'insensitive' };
    if (query.building)     where.building     = { contains: query.building, mode: 'insensitive' };

    if (query.smart === 'urgent') {
      where.urgencyLevel = { in: [UrgencyLevel.URGENT, UrgencyLevel.VERY_URGENT] };
      where.status       = PropertyStatus.APPROVED;
    }
    if (query.smart === 'review') where.status = PropertyStatus.REVIEW;

    const page  = Number(query.page  || 1);
    const limit = Number(query.limit || 20);
    const skip  = (page - 1) * limit;

    let orderBy: any = { lastSeenAt: 'desc' };
    if (query.sort === 'urgent')             orderBy = [{ urgencyLevel: 'desc' }, { lastSeenAt: 'desc' }];
    else if (query.sort === 'most_shared')   orderBy = { shares: { _count: 'desc' } };
    else if (query.sort === 'last_seen')     orderBy = { lastSeenAt: 'desc' };
    else if (query.sort === 'last_activity') orderBy = { lastActivityAt: 'desc' };
    else if (query.sortBy === 'createdAt')   orderBy = { createdAt: query.sortOrder || 'desc' };
    else if (query.sortBy)                   orderBy = { [query.sortBy]: query.sortOrder || 'desc' };


    const [items, total] = await this.prisma.$transaction([
      this.prisma.workspaceListing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          shares: true,
          listingAgents: {
            include: { agent: { include: { phones: true } } },
          },
          canonicalProperty: {
            select: { createdAt: true },
          },
        },
      }),
      this.prisma.workspaceListing.count({ where }),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const enriched = items.map((p) => {
      const hydrated  = this.hydrateAgents(p);
      const leads     = p.shares || [];
      const openLeads = leads.filter((l: any) => l.leadStage !== 'CLOSED' && l.leadStage !== 'LOST');
      const due       = openLeads.filter((l: any) => l.followUpAt && new Date(l.followUpAt) <= today);
      const overdue   = openLeads.filter((l: any) => l.followUpAt && new Date(l.followUpAt) < today);

      return {
        ...hydrated,
        leadsCount:           leads.length,
        dueFollowUpsCount:    due.length,
        overdueFollowUpsCount: overdue.length,
        marketFirstSeenAt:    (p as any).canonicalProperty?.createdAt ?? null,
      };

    });

    return { items: enriched, total, page, pages: Math.ceil(total / limit) };
  }

  /* ================================================================
   * FIND ONE
   * ================================================================ */

  async findOne(workspaceId: string, id: string) {
    const p = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },         // ← workspace guard
      include: {
        listingAgents: {
          include: { agent: { include: { phones: true } } },
        },
      },
    });
    if (!p) return null;
    return this.hydrateAgents(p);
  }

  /* ================================================================
   * GET NEIGHBORS (prev/next for detail page nav)
   * ================================================================ */

  async getNeighbors(workspaceId: string, id: string, query: any) {
    const { items } = await this.findAll(workspaceId, { ...query, limit: 1000, page: 1 });
    const index     = items.findIndex((p: any) => p.id === id);
    return {
      prevId: index > 0              ? items[index - 1].id : null,
      nextId: index < items.length - 1 ? items[index + 1].id : null,
    };
  }

  /* ================================================================
   * SHARE PROPERTY (create client + link listing)
   * ================================================================ */

  async shareProperty(
    workspaceId: string,
    listingId:   string,
    body: {
      platform:       'WHATSAPP';
      clientName?:    string;
      clientPhone:    string;
      teamMemberIds:  string[];
    },
  ) {
    // Guard: listing must belong to this workspace
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const phone = body.clientPhone.replace(/\D/g, '');

    // Upsert client scoped to workspace
    let client = await this.prisma.client.findFirst({
      where: { workspaceId, phones: { some: { phone } } },
    });

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          workspaceId,
          name:   body.clientName || null,
          phones: { create: { phone, primary: true } },
        },
      });
    }

    // Upsert ClientProperty
    const clientProperty = await this.prisma.clientProperty.upsert({
      where:  { clientId_listingId: { clientId: client.id, listingId } },
      update: { lastContactedAt: new Date() },
      create: { clientId: client.id, listingId, lastContactedAt: new Date() },
    });

    // Log the share
    const share = await this.prisma.propertyShare.create({
      data: {
        listingId,
        workspaceId,
        platform:      body.platform,
        targetType:    'PERSON',
        targetName:    body.clientName,
        targetContact: phone,
        clientId:      client.id,
      },
    });

    await this.prisma.workspaceListing.update({
      where: { id: listingId },
      data:  { lastActivityAt: new Date() },
    });

    // Activity log
    await this.prisma.listingActivity.create({
      data: {
        listingId,
        action:  'PROPERTY_SHARED',
        newData: { shareId: share.id, clientId: client.id, clientPropertyId: clientProperty.id },
      },
    });

    return { success: true, clientId: client.id, shareId: share.id };
  }

  /* ================================================================
   * UPDATE
   * ================================================================ */

  async update(workspaceId: string, id: string, dto: any) {
    const old = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },
    });
    if (!old) throw new NotFoundException('Listing not found');

    const data: any = { ...dto };

    if (dto.followUpAt     !== undefined) data.followUpAt     = dto.followUpAt     ? new Date(dto.followUpAt)     : null;
    if (dto.lastContactedAt !== undefined) data.lastContactedAt = dto.lastContactedAt ? new Date(dto.lastContactedAt) : null;
    if (dto.availableFrom  !== undefined) data.availableFrom  = dto.availableFrom  ? new Date(dto.availableFrom)  : null;
    if (dto.negotiable     !== undefined) data.negotiable     = dto.negotiable === null ? null : Boolean(dto.negotiable);
    if (dto.areaSqft       !== undefined) data.areaSqft       = dto.areaSqft !== null ? Number(dto.areaSqft) : null;
    if (dto.price          !== undefined) data.price          = dto.price   ? BigInt(dto.price)   : null;
    if (dto.deposit        !== undefined) data.deposit        = dto.deposit ? BigInt(dto.deposit) : null;

    const nullableFields = ['listingType','propertyCategory','propertySubType','country','city','area','location','building','bhk','areaSqft','furnishing','floor','totalFloors','urgencyLevel','status','availability','notes'];
    for (const key of nullableFields) {
      if (data[key] === '') data[key] = null;
    }

    const updated = await this.prisma.workspaceListing.update({
      where: { id },
      data,
    });

    await this.prisma.listingActivity.create({
      data: { listingId: id, action: 'UPDATED', oldData: old as any, newData: updated as any },
    });

    return updated;
  }

  /* ================================================================
   * UPDATE STATUS
   * ================================================================ */

  async updateStatus(workspaceId: string, id: string, status: PropertyStatus) {
    const before = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },
    });
    if (!before) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.workspaceListing.update({
      where: { id },
      data:  { status },
    });

    await this.prisma.listingActivity.create({
      data: { listingId: id, action: status, oldData: before as any, newData: updated as any },
    });

    return updated;
  }

  /* ================================================================
   * DELETE
   * ================================================================ */

  async delete(workspaceId: string, id: string) {
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.prisma.workspaceListing.delete({ where: { id } });
  }

  /* ================================================================
   * ACTIVITIES
   * ================================================================ */

  async getActivities(workspaceId: string, listingId: string) {
    // Guard
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.listingActivity.findMany({
      where:   { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revertToActivity(workspaceId: string, listingId: string, activityId: string) {
    const activity = await this.prisma.listingActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity || !activity.oldData) throw new Error('No version to revert to');

    const before  = await this.prisma.workspaceListing.findFirst({ where: { id: listingId, workspaceId } });
    const reverted = await this.prisma.workspaceListing.update({
      where: { id: listingId },
      data:  activity.oldData as any,
    });

    await this.prisma.listingActivity.create({
      data: { listingId, action: 'REVERTED', oldData: before as any, newData: reverted as any },
    });

    return reverted;
  }

  /* ================================================================
   * AGENT MANAGEMENT
   * ================================================================ */

  async attachAgent(workspaceId: string, listingId: string, agentId: string) {
    // Guard listing
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.prisma.listingAgent.upsert({
      where:  { listingId_agentId: { listingId, agentId } },
      update: {},
      create: { listingId, agentId },
    });
    return { success: true };
  }

  async detachAgent(workspaceId: string, listingId: string, agentId: string) {
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: listingId, workspaceId },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.prisma.listingAgent.delete({
      where: { listingId_agentId: { listingId, agentId } },
    });
    return { success: true, listingId, agentId };
  }

  async mergeAgents(workspaceId: string, sourceId: string, targetId: string) {
    if (sourceId === targetId) throw new Error('Same agent');

    await this.prisma.$transaction(async (tx) => {
      const source = await tx.agent.findFirst({ where: { id: sourceId, workspaceId }, include: { phones: true } });
      const target = await tx.agent.findFirst({ where: { id: targetId, workspaceId } });
      if (!source || !target) throw new Error('Agent not found');
      if (source.isMerged)    throw new Error('Source already merged');

      for (const p of source.phones) {
        await tx.agentPhone.upsert({
          where:  { agentId_phone: { agentId: targetId, phone: p.phone } },
          update: { agentId: targetId },
          create: { phone: p.phone, agentId: targetId },
        });
      }

      await tx.listingAgent.updateMany({ where: { agentId: sourceId }, data: { agentId: targetId } });
      await tx.agent.update({ where: { id: sourceId }, data: { isMerged: true, mergedIntoId: targetId, mergedAt: new Date() } });
      await tx.agentMergeLog.create({ data: { fromAgentId: sourceId, toAgentId: targetId, mergedBy: workspaceId, reason: 'Manual merge' } });
    });
  }

  /* ================================================================
   * FOLLOW-UPS (workspace-scoped)
   * ================================================================ */

  async getFollowUpsToday(workspaceId: string) {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    return this.prisma.propertyShare.findMany({
      where: {
        workspaceId,                              // ← workspace guard
        followUpAt: { gte: today, lt: tomorrow },
        leadStage:  { notIn: ['CLOSED', 'LOST'] },
      },
      include: { listing: true },
      orderBy: { followUpAt: 'asc' },
    });
  }

  async getPropertyWithDistribution(workspaceId: string, id: string) {
    const p = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },
      include: {
        message: { select: { rawText: true, groupName: true } },
        shares:  true,
        listingAgents: {
          include: { agent: { include: { phones: true } } },
        },
      },
    });
    if (!p) return null;
    return this.hydrateAgents(p);
  }

  /* ================================================================
   * MANUAL PROPERTY CREATION
   * ================================================================ */

  async createManualProperty(
    workspaceId: string,
    payload: {
      method:      'FORM' | 'TEXT';
      propertyData?: any;
      rawText?:    string;
      source: { type: string; contactNumber: string; name?: string; firmName?: string };
    },
  ) {
    const { method, propertyData, rawText, source } = payload;
    if (!source?.contactNumber) throw new Error('Contact number is mandatory');

    const sourceBlock = [
      'SOURCE:',
      `Source Type: ${source.type}`,
      source.name     ? `Broker Name: ${source.name}`   : null,
      source.firmName ? `Firm Name: ${source.firmName}` : null,
      `Mobile: ${source.contactNumber}`,
      '',
      'PROPERTY DETAILS:',
    ].filter(Boolean).join('\n');

    let detailsText = '';
    if (method === 'TEXT') {
      if (!rawText?.trim()) throw new Error('Raw text required for TEXT mode');
      detailsText = rawText.trim();
    }
    if (method === 'FORM') {
      if (!propertyData) throw new Error('propertyData required for FORM mode');
      detailsText = Object.entries(propertyData)
        .map(([k, v]) => (v !== null && v !== undefined && v !== '' ? `${k}: ${v}` : null))
        .filter(Boolean)
        .join('\n');
    }

    const combinedRawText = [sourceBlock, detailsText].join('\n\n');
    const messageKey      = `manual-${Date.now()}`;

    await this.prisma.message.create({
      data: { workspaceId, id: messageKey, groupName: 'MANUAL', messageKey, rawText: combinedRawText },
    });

    const outcome = await this.aiParserService.parseMessage(combinedRawText);
    if (!outcome.success) throw new Error(`AI parse failed [${outcome.reason}]`);

    await this.createFromAi(workspaceId, messageKey, outcome.data, normalizePhone(source.contactNumber));
    return { success: true };
  }

  /* ================================================================
   * INGESTION LOG (internal)
   * ================================================================ */

  private async logIngestion(
    level:       'INFO' | 'WARN' | 'ERROR',
    code:        string,
    message:     string,
    workspaceId: string,
    listingId?:  string,
    payload?:    any,
  ) {
    await this.prisma.ingestionLog.create({
      data: { workspaceId, level, code, message, listingId: listingId || null, payload: payload || undefined },
    });
  }
}

/* ==================================================================
 * PURE HELPERS (no DB access — safe to keep at module level)
 * ================================================================== */

function sanitizeTenantTypes(v: any): TenantType[] {
  if (!Array.isArray(v)) return [TenantType.ANY];
  const allowed = Object.values(TenantType);
  const out     = v.filter((x) => allowed.includes(x));
  return out.length === 0 ? [TenantType.ANY] : (out as TenantType[]);
}

function sanitizeTenantRestrictions(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => ALLOWED_RESTRICTION_CODES.has(x));
}

function mapListingType(v: any): ListingType | null {
  if (v === 'RENT') return ListingType.RENT;
  if (v === 'SALE') return ListingType.SALE;
  return null;
}

function mapPropertyCategory(v: any): PropertyCategory | null {
  if (v === 'RESIDENTIAL') return PropertyCategory.RESIDENTIAL;
  if (v === 'COMMERCIAL')  return PropertyCategory.COMMERCIAL;
  return null;
}

function mapPropertySubType(v: any): PropertySubType {
  if (Object.values(PropertySubType).includes(v)) return v;
  return PropertySubType.OTHER;
}

function mapFurnishing(v: any): FurnishingType | null {
  if (v === 'UNFURNISHED')    return FurnishingType.UNFURNISHED;
  if (v === 'SEMI_FURNISHED') return FurnishingType.SEMI_FURNISHED;
  if (v === 'FULLY_FURNISHED') return FurnishingType.FULLY_FURNISHED;
  return null;
}

function mapUrgency(v: any): UrgencyLevel {
  if (v === 'VERY_URGENT') return UrgencyLevel.VERY_URGENT;
  if (v === 'URGENT')      return UrgencyLevel.URGENT;
  return UrgencyLevel.NORMAL;
}

function normalizeContacts(input: string[]): string[] {
  const all: string[] = [];
  for (const raw of input || []) {
    for (const m of raw.match(/\+?\d[\d\s\-]{8,}/g) || []) {
      const clean = m.replace(/\D/g, '');
      if (clean.length >= 10) all.push(clean);
    }
  }
  return [...new Set(all)];
}

function extractIndianPhone(jid: string | null): string | null {
  if (!jid) return null;
  const n = jid.split('@')[0].split(':')[0];
  if (!/^\d+$/.test(n)) return null;
  if (n.length === 10)   return n;
  if (n.length === 12 && n.startsWith('91')) return n.slice(2);
  return null;
}

function normalizeBhk(input: any): string | null {
  if (!input) return null;
  const text = String(input).toLowerCase();
  if (text.includes('studio')) return 'Studio';
  if (text.includes('rk'))     return '1RK';
  const n = parseInt((text.match(/\d+/)||[])[0] || '', 10);
  if (isNaN(n) || n <= 0 || n > 20) return null;
  return `${n}BHK`;
}

function normalizePhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  return digits.length === 10 ? digits : null;
}

function looksLikeFirm(line: string): boolean {
  const l = line.toLowerCase();
  return ['realty','real estate','estate','properties','property','broker','consultant','associates','group','infratech','developers'].some((k) => l.includes(k));
}

function cleanName(line: string): string | null {
  if (!line) return null;
  let s = line.trim();
  const labelWords = ['mobile','phone','contact','whatsapp','call','number'];
  if (labelWords.includes(s.toLowerCase().replace(':', '').trim())) return null;
  s = s.replace(/\+?\d[\d\s\-]{8,}/g, ' ');
  const junk = ['visit','inspection','available','allowed','family','bachelors','only','rent','sale','flat','bhk','sqft','price','deposit','realty','property','properties','estate','broker','consultant'];
  if (junk.some((w) => s.toLowerCase().includes(w))) return null;
  s = s.replace(/[-,–—:]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = s.split(' ');
  if (parts.length < 1 || parts.length > 3) return null;
  for (const p of parts) { if (!/^[A-Z][a-z]+$/.test(p)) return null; }
  return isValidHumanName(s) ? s : null;
}

function sanitizeHumanName(input: string): string | null {
  if (!input) return null;
  let s = input.trim()
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, ' ')
    .replace(/[*_~•]+/g, ' ')
    .replace(/\+?\d[\d\s\-]{8,}/g, ' ');

  const honorifics = ['mr','mr.','mrs','mrs.','ms','ms.','shri','shree','smt','sir','madam'];
  s = s.split(/\s+/).filter((w) => !honorifics.includes(w.toLowerCase())).join(' ');
  s = s.replace(/\./g, ' ').replace(/[-,–—:]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  return s.toLowerCase().split(' ').map((w) => w.length === 1 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)).join(' ');
}

function isValidHumanName(name: string): boolean {
  if (!name) return false;
  const raw   = name.trim();
  const lower = raw.toLowerCase();
  const blocked = new Set(['-','name','agent','broker','mobile','phone','contact','call','number','whatsapp']);
  if (blocked.has(lower.replace(':', ''))) return false;
  if (raw.length < 3 || raw.length > 50)   return false;
  if (/\d/.test(raw))                       return false;
  const nonHuman = ['building','tower','block','society','residency','apartment','apartments','complex','heights','plaza','road','street','lane','nagar','sector','phase','near','opp','opposite','behind','metro','property','properties','realty','estate','brokerage'];
  if (nonHuman.some((w) => lower.includes(w))) return false;
  const parts = raw.split(/\s+/);
  if (parts.length < 1 || parts.length > 4) return false;
  for (const p of parts) { if (!/^[A-Z][a-z]*$/.test(p)) return false; }
  return true;
}

function parseCsv(v: any): string[] {
  if (!v || typeof v !== 'string') return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function resolveDateRange(query: { datePreset?: string; fromDate?: string; toDate?: string }) {
  const now = new Date();
  const s   = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const e   = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

  if (query.datePreset) {
    const end  = e(now);
    const start = new Date(end);
    if (query.datePreset === 'TODAY')       return { gte: s(now), lte: end };
    if (query.datePreset === 'LAST_7_DAYS') { start.setDate(start.getDate() - 6);  return { gte: s(start), lte: end }; }
    if (query.datePreset === 'LAST_14_DAYS'){ start.setDate(start.getDate() - 13); return { gte: s(start), lte: end }; }
    if (query.datePreset === 'LAST_30_DAYS'){ start.setDate(start.getDate() - 29); return { gte: s(start), lte: end }; }
  }

  if (query.fromDate) {
    return { gte: s(new Date(query.fromDate)), lte: query.toDate ? e(new Date(query.toDate)) : e(now) };
  }

  return null;
}