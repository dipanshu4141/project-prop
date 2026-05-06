// // import { Injectable, Logger } from '@nestjs/common';
// // import OpenAI from 'openai';

// // @Injectable()
// // export class AiParserService {
// //   private readonly logger = new Logger('AI-PARSER');
// //   private openai = new OpenAI({
// //     apiKey: process.env.OPENAI_API_KEY,
// //   });

// //   async parseMessage(text: string): Promise<any[]> {
// //     const prompt = `
// // Extract all property listings from this WhatsApp message.

// // Rules:
// // - If no property info, return empty array []
// // - If multiple properties, return array
// // - Return ONLY valid JSON, no explanation.

// // Each item must have:
// // {
// //   "type": "rent|sale",
// //   "location": string|null,
// //   "price": number|null,
// //   "deposit": number|null,
// //   "bhk": string|null,
// //   "areaSqft": number|null,
// //   "furnishing": string|null,
// //   "building": string|null,
// //   "contact": string|null,
// //   "brokerType": "broker|owner|unknown",
// //   "confidence": number
// // }

// // Message:
// // """
// // ${text}
// // """
// // `;

// //     const res = await this.openai.chat.completions.create({
// //       model: 'gpt-4o-mini',
// //       temperature: 0,
// //       messages: [{ role: 'user', content: prompt }],
// //     });

// //     const content = res.choices[0].message.content || '[]';

// //     this.logger.log('AI RAW RESPONSE:');
// //     this.logger.log(content);

    

// //     try {
// //       return JSON.parse(content);
// //     } catch (e) {
// //         this.logger.error('AI JSON parse failed');
// //         this.logger.error(content);
// //         return [];
// //     }
// //   }
  
// // }





// import { Injectable, Logger } from '@nestjs/common';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { looksLikeGarbageName } from '../../../common/utils/nameSanitizer';

// /* =======================
//    Types
// ======================= */

// export interface AiProperty {
//   listingType: "RENT" | "SALE";
//   propertyCategory: "RESIDENTIAL" | "COMMERCIAL";
//   propertySubType: string;

//   country: string | null;
//   city: string | null;
//   area: string | null;
//   location: string | null;
//   building: string | null;

//   price: number | null;
//   deposit: number | null;
//   bhk: string | null;
//   areaSqft: number | null;
//   furnishing: string | null;

//   urgencyLevel: "NORMAL" | "URGENT" | "VERY_URGENT";
//   tenantPreferences: string[];

//   confidence: number;
// }


// export interface AiContactBlock {
//   firmName: string | null;
//   agentName: string | null;
//   contacts: string[];
// }

// export interface AiParseResult {
//   properties: AiProperty[];
//   contactBlock: AiContactBlock;
// }

// /* =======================
//    Service
// ======================= */

// @Injectable()
// export class AiParserService {
//   private readonly logger = new Logger('AI-PARSER');
//   private genAI: GoogleGenerativeAI;

//   constructor() {
//     const key = process.env.GEMINI_API_KEY;
//     if (!key) {
//       throw new Error('GEMINI_API_KEY not found in env');
//     }
//     this.genAI = new GoogleGenerativeAI(key);
//   }

//   async parseMessage(text: string): Promise<AiParseResult | null> {
//     const model = this.genAI.getGenerativeModel({
//       model: 'gemini-2.5-flash-lite', // stable & widely available
//     });

//     const prompt = `
// You are an expert Indian real estate data extractor.

// Your job:
// - Extract all property listings from this WhatsApp message.
// - Extract tenant rules from the message.
// - Output STRICT JSON ONLY. No explanation. No markdown.

// ===============================
// TENANT RULE SYSTEM (MANDATORY)
// ===============================

// Every property object MUST include:

// tenantTypes: array of one or more of:
// ["BACHELORS","FAMILY","GIRLS","BOYS","ANY"]

// tenantRestrictions: array of zero or more of:
// [
// "ONLY_HINDU",
// "ONLY_MUSLIM",
// "ONLY_JAIN",
// "ONLY_VEGETARIAN",
// "NO_PETS",
// "WORKING_PROFESSIONALS",
// "ONLY_MARRIED",
// "ONLY_GUJARATI"
// ]

// Rules:
// - If message says "only family" → tenantTypes = ["FAMILY"]
// - If message says "bachelors and family" → tenantTypes = ["BACHELORS","FAMILY"]
// - If message says "Jain preferred" → include "ONLY_JAIN"
// - If message says "only Hindu" → include "ONLY_HINDU"
// - If message says "no pets" → include "NO_PETS"
// - If message says "working people only" → include "WORKING_PROFESSIONALS"
// - If nothing is mentioned → tenantTypes = ["ANY"], tenantRestrictions = []

// - Only output values from the allowed lists.
// - Do NOT invent new codes.
// - Always include both fields even if empty.

// ===============================
// OUTPUT FORMAT (STRICT JSON)
// ===============================

// {
//   "properties": [
//     {
//       "listingType": "RENT|SALE",
//       "propertyCategory": "RESIDENTIAL|COMMERCIAL",
//       "propertySubType": "APARTMENT|SHOP|OFFICE|VILLA|OTHER",

//       "country": "India",
//       "city": "Mumbai",
//       "area": string|null,
//       "building": string|null,
//       "location": string|null,

//       "price": number|null,
//       "deposit": number|null,
//       "bhk": string|null,
//       "areaSqft": number|null,
//       "furnishing": "UNFURNISHED|SEMI_FURNISHED|FULLY_FURNISHED"|null,

//       "urgencyLevel": "NORMAL|URGENT|VERY_URGENT",

//       "tenantTypes": string[],
//       "tenantRestrictions": string[],

//       "confidence": number
//     }
//   ],
//   "contactBlock": {
//     "firmName": string|null,
//     "agentName": string|null,
//     "contacts": string[]
//   }
// }

// ===============================
// LOCATION RULES (VERY IMPORTANT)
// ===============================

// 1) "area" = the well-known locality name (e.g. "Andheri West", "Bandra", "Powai", "Goregaon East")
// 2) "building" = ONLY the building / society / tower name (e.g. "Green Tower", "Lashkaria Empress")
// 3) "location" = the full descriptive location text (landmarks, road, metro, etc)

// 4) If building name is not clearly mentioned, set "building": null
// 5) If area is not clearly inferable, set "area": null

// 6) DO NOT put area inside building
// 7) DO NOT put building inside area
// 8) DO NOT repeat same text in area and location

// 9) If message says "near", "opp", "behind", "close to", those go into "location", NOT into "area"

// 10) Examples:

// "Flat in Green Tower, Andheri West near Azad Nagar Metro"
// → area = "Andheri West"
// → building = "Green Tower"
// → location = "Near Azad Nagar Metro, Andheri West"

// "Shop at DN Nagar Andheri West"
// → area = "Andheri West"
// → building = null
// → location = "DN Nagar, Andheri West"

// "2BHK Bandra Turner Road Silver Rock"
// → area = "Bandra"
// → building = "Silver Rock"
// → location = "Turner Road, Bandra"

// 11) Normalize spellings (e.g. "Goregoan" → "Goregaon")

// 12) If multiple properties, return array.

// 13) If message does not contain any property listing, return:
// {
//   "properties": [],
//   "contactBlock": { "firmName": null, "agentName": null, "contacts": [] }
// }

// 14) Return ONLY JSON. No explanation. No markdown. No comments.

// ===============================
// MESSAGE:
// ===============================
// """
// ${text}
// """
// `;




//     try {
//       const result = await model.generateContent(prompt);
//       const response = result.response.text();

//       this.logger.log('Gemini RAW RESPONSE:');
//       this.logger.log(response);

//       // Clean ```json blocks if present
//       const cleaned = response
//         .replace(/```json/gi, '')
//         .replace(/```/g, '')
//         .trim();

//         const parsed = JSON.parse(cleaned);

//         /* ------------------ SANITIZE AGENT NAME ------------------ */
//         if (parsed?.contactBlock?.agentName) {
//           const n = String(parsed.contactBlock.agentName).trim();
        
//           if (
//             n === "-" ||
//             n.length < 3 ||
//             looksLikeGarbageName(n)
//           ) {
//             parsed.contactBlock.agentName = null;
//           }
//         }
//         /* -------------------------------------------------------- */
        


//       // Validate shape
//       if (
//         parsed &&
//         typeof parsed === 'object' &&
//         Array.isArray(parsed.properties)
//       ) {
//         return parsed as AiParseResult;
//       }

//       this.logger.warn('Gemini returned JSON but not in expected shape');
//       return null;
//     } catch (err) {
//       this.logger.error('Gemini parsing failed', err);
//       return null;
//     }
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { looksLikeGarbageName } from '../../../common/utils/nameSanitizer';
import { buildExtractionPrompt } from './extract-property.prompt';
import {
  AiParseResult,
  AiProperty,
  ParseOutcome,
} from './ai-parser.types';
import { PreClassifiedResult } from '../../../modules/messages/pre-classifier.service';

// Re-export all types so existing imports from this file continue to work
export type {
  AiParseResult,
  AiContactBlock,
  AiProperty,
  ParseOutcome,
  ParseFailureReason,
} from './ai-parser.types';

// ── Constants ────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

const VALID_FURNISHING = new Set(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED']);
const VALID_URGENCY = new Set(['NORMAL', 'URGENT', 'VERY_URGENT']);
const VALID_LISTING_TYPES = new Set(['RENT', 'SALE']);
const VALID_PROPERTY_CATEGORIES = new Set(['RESIDENTIAL', 'COMMERCIAL']);
const VALID_TENANT_TYPES = new Set(['BACHELORS', 'FAMILY', 'GIRLS', 'BOYS', 'ANY']);
const VALID_TENANT_RESTRICTIONS = new Set([
  'ONLY_HINDU', 'ONLY_MUSLIM', 'ONLY_JAIN', 'ONLY_VEGETARIAN',
  'NO_PETS', 'WORKING_PROFESSIONALS', 'ONLY_MARRIED', 'ONLY_GUJARATI',
]);

// ── Service ──────────────────────────────────────────────────

@Injectable()
export class AiParserService {
  private readonly logger = new Logger('AI-PARSER');
  private readonly model: GenerativeModel;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY not found in env');
    }
    // Model instantiated once and reused across all calls
    const genAI = new GoogleGenerativeAI(key);
    this.model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 },
      } as any,
    });

  }

  // ── Public API ─────────────────────────────────────────────

  async parseMessage(text: string): Promise<ParseOutcome> {
    const trimmed = text?.trim();
    if (!trimmed) {
      return { success: false, reason: 'empty_input' };
    }

    const truncated = trimmed.length > 3000;
    const prompt = buildExtractionPrompt(trimmed);

    // Call Gemini with retry + timeout
    let rawResponse: string;
    try {
      rawResponse = await this.callWithRetry(prompt);
    } catch (err) {
      const reason = (err as Error).message === 'timeout' ? 'timeout' : 'gemini_error';
      this.logger.error(`Gemini call failed [${reason}]`, err);
      return { success: false, reason };
    }

    if (process.env.LOG_AI_RESPONSES === 'true') {
      this.logger.debug('Gemini RAW response:\n' + rawResponse);
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.cleanJsonResponse(rawResponse));
    } catch {
      this.logger.error('Gemini JSON parse failed. Raw:\n' + rawResponse);
      return { success: false, reason: 'parse_error' };
    }

    // Validate shape
    if (!this.isValidShape(parsed)) {
      this.logger.warn('Gemini returned JSON but shape is unexpected');
      return { success: false, reason: 'shape_error' };
    }

    // Sanitize & normalize all fields
    const data = this.sanitize(parsed);

    return { success: true, data, truncated };
  }

  async parseWithHints(
    raw: string,
    hints: PreClassifiedResult['extracted'],
  ): Promise<ParseOutcome> {
    const hintsText = [
      hints.listingType && `Listing type: ${hints.listingType}`,
      hints.location    && `Location: ${hints.location}`,
      hints.bhk         && `BHK: ${hints.bhk}`,
      hints.price       && `Price: ₹${hints.price} (raw: ${hints.priceRaw})`,
      hints.furnishing  && `Furnishing: ${hints.furnishing}`,
      hints.phones.length && `Phones: ${hints.phones.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');
  
    const hintedRaw = `${raw}\n\n[PRE-EXTRACTED HINTS — verify and fill remaining fields]\n${hintsText}`;
  
    return this.parseMessage(hintedRaw);   // ← parseMessage, not parse
  }



  // ── Gemini call with retry + timeout ──────────────────────

  private async callWithRetry(prompt: string): Promise<string> {
    let lastError: Error = new Error('unknown');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const text = await this.callWithTimeout(prompt);
        if (attempt > 0) {
          this.logger.log(`Gemini succeeded on retry attempt ${attempt + 1}`);
        }
        return text;
      } catch (err) {
        lastError = err as Error;

        // Don't retry on timeout — it's likely a long-running problem
        if (lastError.message === 'timeout') throw lastError;

        this.logger.warn(`Gemini attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  private async callWithTimeout(prompt: string): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), GEMINI_TIMEOUT_MS),
    );

    const callPromise = this.model
      .generateContent(prompt)
      .then((r) => r.response.text());

    return Promise.race([callPromise, timeoutPromise]);
  }

  // ── JSON cleaning ─────────────────────────────────────────

  /**
   * Strips markdown code fences and stray prefixes that Gemini sometimes adds.
   * Handles: ```json ... ```, ``` ... ```, plain leading "json\n"
   */
  private cleanJsonResponse(raw: string): string {
    return raw
      .replace(/^```[\w]*\s*/m, '')
      .replace(/```\s*$/m, '')
      .replace(/^\s*json\s*/i, '')
      .trim();
  }

  // ── Shape validation ──────────────────────────────────────

  private isValidShape(parsed: unknown): parsed is AiParseResult {
    if (!parsed || typeof parsed !== 'object') return false;
    const p = parsed as Record<string, unknown>;

    if (!Array.isArray(p.properties)) return false;

    if (
      !p.contactBlock ||
      typeof p.contactBlock !== 'object'
    ) return false;

    const cb = p.contactBlock as Record<string, unknown>;
    if (!Array.isArray(cb.contacts)) return false;

    return true;
  }

  // ── Sanitization & normalization ──────────────────────────

  private sanitize(raw: AiParseResult): AiParseResult {
    return {
      properties: raw.properties.map((p) => this.sanitizeProperty(p)),
      contactBlock: {
        firmName: this.sanitizeShortString(raw.contactBlock.firmName),
        agentName: this.sanitizeAgentName(raw.contactBlock.agentName),
        contacts: raw.contactBlock.contacts
          .map((c) => this.normalizePhone(c))
          .filter((c): c is string => c !== null),
      },
    };
  }

  private sanitizeProperty(p: AiProperty): AiProperty {
    return {
      // Enum fields — fall back to safe defaults if AI hallucinates a value
      listingType: VALID_LISTING_TYPES.has(p.listingType) ? p.listingType : 'RENT',
      propertyCategory: VALID_PROPERTY_CATEGORIES.has(p.propertyCategory)
        ? p.propertyCategory
        : 'RESIDENTIAL',
      propertySubType: this.sanitizeShortString(p.propertySubType) ?? 'OTHER',

      // Location
      country: this.sanitizeShortString(p.country) ?? 'India',
      city: this.sanitizeShortString(p.city),
      area: this.sanitizeShortString(p.area),
      building: this.sanitizeShortString(p.building),
      location: this.sanitizeShortString(p.location),

      // Numerics — coerce strings like "75k" are already handled by AI,
      // but guard against non-numeric values reaching here
      price: this.sanitizeNumber(p.price),
      deposit: this.sanitizeNumber(p.deposit),
      areaSqft: this.sanitizeNumber(p.areaSqft),

      bhk: this.sanitizeShortString(p.bhk),

      furnishing:
        p.furnishing && VALID_FURNISHING.has(p.furnishing) ? p.furnishing : null,

      urgencyLevel: VALID_URGENCY.has(p.urgencyLevel) ? p.urgencyLevel : 'NORMAL',

      // Tenant arrays — filter to only known codes
      tenantTypes: Array.isArray(p.tenantTypes)
        ? p.tenantTypes.filter((t) => VALID_TENANT_TYPES.has(t))
        : ['ANY'],
      tenantRestrictions: Array.isArray(p.tenantRestrictions)
        ? p.tenantRestrictions.filter((r) => VALID_TENANT_RESTRICTIONS.has(r))
        : [],

      // Confidence clamped to [0, 1]
      confidence: Math.min(1, Math.max(0, Number(p.confidence) || 0)),
    };
  }

  // ── Field-level sanitizers ────────────────────────────────

  private sanitizeAgentName(name: unknown): string | null {
    if (!name || typeof name !== 'string') return null;
    const trimmed = name.trim();
    if (trimmed === '-' || trimmed.length < 3) return null;
    try {
      if (looksLikeGarbageName(trimmed)) return null;
    } catch {
      // If utility throws, be conservative and keep the name
    }
    return trimmed;
  }

  private sanitizeShortString(value: unknown): string | null {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private sanitizeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return isFinite(n) && n >= 0 ? n : null;
  }

  /**
   * Normalises Indian phone numbers to a consistent format.
   * Strips spaces, dashes, brackets. Adds +91 if 10-digit number.
   * Returns null if the string doesn't look like a phone number.
   */
  private normalizePhone(raw: string): string | null {
    if (!raw || typeof raw !== 'string') return null;

    // Strip all non-digit characters except leading +
    const digits = raw.replace(/[^\d+]/g, '');

    // Already E.164 with country code
    if (/^\+91\d{10}$/.test(digits)) return digits;

    // 10-digit Indian number without country code
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;

    // 91 prefix without +
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;

    // Unrecognised — return as-is, stripped of spaces
    const stripped = raw.replace(/\s+/g, '');
    return stripped.length > 0 ? stripped : null;
  }
}
