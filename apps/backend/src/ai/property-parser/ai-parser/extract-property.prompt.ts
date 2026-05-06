/**
 * Builds the Gemini prompt for extracting property listings from a WhatsApp message.
 * Extracted to a separate file for testability and easy tuning.
 */

const MAX_INPUT_CHARS = 3000;

export function buildExtractionPrompt(rawText: string): string {
  const text =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS) + '\n[MESSAGE TRUNCATED]'
      : rawText;

  return `
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
`.trim();
}