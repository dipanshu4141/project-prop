// import { Injectable, Logger } from '@nestjs/common';
// import OpenAI from 'openai';

// @Injectable()
// export class AiParserService {
//   private readonly logger = new Logger('AI-PARSER');
//   private openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

//   async parseMessage(text: string): Promise<any[]> {
//     const prompt = `
// Extract all property listings from this WhatsApp message.

// Rules:
// - If no property info, return empty array []
// - If multiple properties, return array
// - Return ONLY valid JSON, no explanation.

// Each item must have:
// {
//   "type": "rent|sale",
//   "location": string|null,
//   "price": number|null,
//   "deposit": number|null,
//   "bhk": string|null,
//   "areaSqft": number|null,
//   "furnishing": string|null,
//   "building": string|null,
//   "contact": string|null,
//   "brokerType": "broker|owner|unknown",
//   "confidence": number
// }

// Message:
// """
// ${text}
// """
// `;

//     const res = await this.openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       temperature: 0,
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const content = res.choices[0].message.content || '[]';

//     this.logger.log('AI RAW RESPONSE:');
//     this.logger.log(content);

    

//     try {
//       return JSON.parse(content);
//     } catch (e) {
//         this.logger.error('AI JSON parse failed');
//         this.logger.error(content);
//         return [];
//     }
//   }
  
// }





import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { looksLikeGarbageName } from '../../common/utils/nameSanitizer';

/* =======================
   Types
======================= */

export interface AiProperty {
  listingType: "RENT" | "SALE";
  propertyCategory: "RESIDENTIAL" | "COMMERCIAL";
  propertySubType: string;

  country: string | null;
  city: string | null;
  area: string | null;
  location: string | null;
  building: string | null;

  price: number | null;
  deposit: number | null;
  bhk: string | null;
  areaSqft: number | null;
  furnishing: string | null;

  urgencyLevel: "NORMAL" | "URGENT" | "VERY_URGENT";
  tenantPreferences: string[];

  confidence: number;
}


export interface AiContactBlock {
  firmName: string | null;
  agentName: string | null;
  contacts: string[];
}

export interface AiParseResult {
  properties: AiProperty[];
  contactBlock: AiContactBlock;
}

/* =======================
   Service
======================= */

@Injectable()
export class AiParserService {
  private readonly logger = new Logger('AI-PARSER');
  private genAI: GoogleGenerativeAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY not found in env');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  async parseMessage(text: string): Promise<AiParseResult | null> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', // stable & widely available
    });

    const prompt = `
You are an expert Indian real estate data extractor.

Your job:
- Extract all property listings from this WhatsApp message.
- Extract tenant rules from the message.
- Output STRICT JSON ONLY. No explanation. No markdown.

===============================
TENANT RULE SYSTEM (MANDATORY)
===============================

Every property object MUST include:

tenantTypes: array of one or more of:
["BACHELORS","FAMILY","GIRLS","BOYS","ANY"]

tenantRestrictions: array of zero or more of:
[
"ONLY_HINDU",
"ONLY_MUSLIM",
"ONLY_JAIN",
"ONLY_VEGETARIAN",
"NO_PETS",
"WORKING_PROFESSIONALS",
"ONLY_MARRIED",
"ONLY_GUJARATI"
]

Rules:
- If message says "only family" → tenantTypes = ["FAMILY"]
- If message says "bachelors and family" → tenantTypes = ["BACHELORS","FAMILY"]
- If message says "Jain preferred" → include "ONLY_JAIN"
- If message says "only Hindu" → include "ONLY_HINDU"
- If message says "no pets" → include "NO_PETS"
- If message says "working people only" → include "WORKING_PROFESSIONALS"
- If nothing is mentioned → tenantTypes = ["ANY"], tenantRestrictions = []

- Only output values from the allowed lists.
- Do NOT invent new codes.
- Always include both fields even if empty.

===============================
OUTPUT FORMAT (STRICT JSON)
===============================

{
  "properties": [
    {
      "listingType": "RENT|SALE",
      "propertyCategory": "RESIDENTIAL|COMMERCIAL",
      "propertySubType": "APARTMENT|SHOP|OFFICE|VILLA|OTHER",

      "country": "India",
      "city": "Mumbai",
      "area": string|null,
      "building": string|null,
      "location": string|null,

      "price": number|null,
      "deposit": number|null,
      "bhk": string|null,
      "areaSqft": number|null,
      "furnishing": "UNFURNISHED|SEMI_FURNISHED|FULLY_FURNISHED"|null,

      "urgencyLevel": "NORMAL|URGENT|VERY_URGENT",

      "tenantTypes": string[],
      "tenantRestrictions": string[],

      "confidence": number
    }
  ],
  "contactBlock": {
    "firmName": string|null,
    "agentName": string|null,
    "contacts": string[]
  }
}

===============================
LOCATION RULES (VERY IMPORTANT)
===============================

1) "area" = the well-known locality name (e.g. "Andheri West", "Bandra", "Powai", "Goregaon East")
2) "building" = ONLY the building / society / tower name (e.g. "Green Tower", "Lashkaria Empress")
3) "location" = the full descriptive location text (landmarks, road, metro, etc)

4) If building name is not clearly mentioned, set "building": null
5) If area is not clearly inferable, set "area": null

6) DO NOT put area inside building
7) DO NOT put building inside area
8) DO NOT repeat same text in area and location

9) If message says "near", "opp", "behind", "close to", those go into "location", NOT into "area"

10) Examples:

"Flat in Green Tower, Andheri West near Azad Nagar Metro"
→ area = "Andheri West"
→ building = "Green Tower"
→ location = "Near Azad Nagar Metro, Andheri West"

"Shop at DN Nagar Andheri West"
→ area = "Andheri West"
→ building = null
→ location = "DN Nagar, Andheri West"

"2BHK Bandra Turner Road Silver Rock"
→ area = "Bandra"
→ building = "Silver Rock"
→ location = "Turner Road, Bandra"

11) Normalize spellings (e.g. "Goregoan" → "Goregaon")

12) If multiple properties, return array.

13) If message does not contain any property listing, return:
{
  "properties": [],
  "contactBlock": { "firmName": null, "agentName": null, "contacts": [] }
}

14) Return ONLY JSON. No explanation. No markdown. No comments.

===============================
MESSAGE:
===============================
"""
${text}
"""
`;




    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      this.logger.log('Gemini RAW RESPONSE:');
      this.logger.log(response);

      // Clean ```json blocks if present
      const cleaned = response
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

        const parsed = JSON.parse(cleaned);

        /* ------------------ SANITIZE AGENT NAME ------------------ */
        if (parsed?.contactBlock?.agentName) {
          const n = String(parsed.contactBlock.agentName).trim();
        
          if (
            n === "-" ||
            n.length < 3 ||
            looksLikeGarbageName(n)
          ) {
            parsed.contactBlock.agentName = null;
          }
        }
        /* -------------------------------------------------------- */
        


      // Validate shape
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.properties)
      ) {
        return parsed as AiParseResult;
      }

      this.logger.warn('Gemini returned JSON but not in expected shape');
      return null;
    } catch (err) {
      this.logger.error('Gemini parsing failed', err);
      return null;
    }
  }
}
