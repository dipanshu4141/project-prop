/* ============================================================
   ai-parser.types.ts
   All shared types for the AI property parsing system.
   ============================================================ */

// ── Raw AI output shapes ──────────────────────────────────────

export interface AiProperty {
  listingType: 'RENT' | 'SALE';
  propertyCategory: 'RESIDENTIAL' | 'COMMERCIAL';
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
  furnishing: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED' | null;

  urgencyLevel: 'NORMAL' | 'URGENT' | 'VERY_URGENT';
  tenantTypes: string[];
  tenantRestrictions: string[];

  /** Clamped to [0, 1] after parsing */
  confidence: number;
}

export interface AiContactBlock {
  firmName: string | null;
  agentName: string | null;
  /** Phone numbers, normalised to E.164 where possible */
  contacts: string[];
}

export interface AiParseResult {
  properties: AiProperty[];
  contactBlock: AiContactBlock;
}

// ── Service outcome ───────────────────────────────────────────

export type ParseOutcome =
  | { success: true; data: AiParseResult; truncated: boolean }
  | { success: false; reason: ParseFailureReason };

export type ParseFailureReason =
  | 'empty_input'
  | 'gemini_error'
  | 'parse_error'
  | 'shape_error'
  | 'timeout';