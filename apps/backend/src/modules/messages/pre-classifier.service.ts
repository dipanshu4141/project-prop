import { Injectable } from '@nestjs/common';

export interface PreClassifiedResult {
  skip: boolean;
  skipReason?: string;
  extracted: {
    phones: string[];
    price: number | null;
    priceRaw: string | null;
    bhk: string | null;
    listingType: 'RENT' | 'SALE' | null;
    location: string | null;
    furnishing: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED' | null;
    tenantTypes: string[];
    isUrgent: boolean;
    signalCount: number;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

const MUMBAI_AREAS = [
  'andheri west', 'andheri east', 'bandra', 'powai', 'juhu', 'versova',
  'malad', 'goregaon', 'kandivali', 'borivali', 'dadar', 'worli',
  'vile parle', 'santacruz', 'khar', 'kurla', 'ghatkopar', 'mulund',
  'bhandup', 'vikhroli', 'hiranandani', 'irla', 'oshiwara', 'lokhandwala',
  'dn nagar', 'jogeshwari', 'charkop', 'dahisar', 'mira road', 'lower parel',
  'prabhadevi', 'matunga', 'sion', 'chembur', 'colaba', 'nariman point',
  'fort', 'churchgate', 'cuffe parade', 'wadala', 'lbs', 'ghodbunder',
  'navi mumbai', 'kharghar', 'nerul', 'seawoods', 'belapur', 'panvel',
];

const NOISE_KEYWORDS = [
  'good morning', 'gm ', 'congratulations', 'congrats', 'happy birthday',
  'noted', 'please share', 'kindly share', 'send details', 'any update',
];

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

const SEMI_VARIANTS   = ['semi furnished', 'semi-furnished', 'semifurnished', 'semi furn'];
const UNFURN_VARIANTS = ['unfurnished', 'unfurnish', 'unfurn', 'bare shell', 'empty'];
const FURN_VARIANTS   = ['furnished', 'furnishd', 'farnished', 'furnish'];

function fuzzyFurnishing(text: string): 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED' | null {
  for (const v of SEMI_VARIANTS) if (text.includes(v)) return 'SEMI_FURNISHED';
  const words = text.split(/\s+/);
  for (const word of words) {
    for (const v of UNFURN_VARIANTS) if (levenshtein(word, v) <= 2) return 'UNFURNISHED';
    for (const v of FURN_VARIANTS)   if (levenshtein(word, v) <= 2) return 'FURNISHED';
  }
  return null;
}

function parsePrice(text: string): { price: number | null; priceRaw: string | null } {
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)\s*(k|lakh|lac|l|cr|crore)?/i);
  if (rangeMatch) {
    const price = applyUnit(parseFloat(rangeMatch[2]), (rangeMatch[3] || '').toLowerCase());
    if (price) return { price, priceRaw: rangeMatch[0] };
  }
  const rupeeMatch = text.match(/₹\s*([\d,]+)/);
  if (rupeeMatch) return { price: parseInt(rupeeMatch[1].replace(/,/g, ''), 10), priceRaw: rupeeMatch[0] };
  const commaMatch = text.match(/\b(\d{1,2}),(\d{3})\b/);
  if (commaMatch) return { price: parseInt(`${commaMatch[1]}${commaMatch[2]}`, 10), priceRaw: commaMatch[0] };
  const unitMatch = text.match(/(?:asking\s+|budget\s+)?(\d+(?:\.\d+)?)\s*(k|lakh|lac|l\b|cr\b|crore)/i);
  if (unitMatch) {
    const price = applyUnit(parseFloat(unitMatch[1]), unitMatch[2].toLowerCase());
    if (price) return { price, priceRaw: unitMatch[0] };
  }
  return { price: null, priceRaw: null };
}

function applyUnit(num: number, unit: string): number | null {
  if (unit === 'k')                                      return num * 1_000;
  if (unit === 'lakh' || unit === 'lac' || unit === 'l') return num * 100_000;
  if (unit === 'cr'   || unit === 'crore')               return num * 10_000_000;
  return null;
}

@Injectable()
export class PreClassifierService {
  classify(text: string): PreClassifiedResult {
    const lower = text.toLowerCase().trim();

    if (lower.length < 20) return this.skip('TOO_SHORT');
    if (NOISE_KEYWORDS.some((kw) => lower.includes(kw)) && lower.length < 80) return this.skip('SOCIAL_NOISE');

    const phones = [...text.matchAll(/(?<!\d)([6-9]\d{9})(?!\d)/g)].map((m) => m[1]);
    const { price, priceRaw } = parsePrice(lower);
    const bhkMatch = lower.match(/\b(studio|1\.5\s*bhk|[1-4]\s*bhk|[1-4]\s*rk)\b/i);
    const bhk = bhkMatch ? bhkMatch[0].replace(/\s+/g, '').toUpperCase() : null;

    // REQUIREMENT → treated as RENT (schema has no REQUIREMENT ListingType)
    let listingType: 'RENT' | 'SALE' | null = null;
    if (/\b(for sale|outright|resale|sell|selling)\b/.test(lower))         listingType = 'SALE';
    else if (/\b(for rent|on rent|rental|to let|lease|rent)\b/.test(lower)) listingType = 'RENT';

    let location: string | null = null;
    for (const area of MUMBAI_AREAS) {
      if (lower.includes(area)) { location = area; break; }
    }

    const furnishing = fuzzyFurnishing(lower);

    const tenantTypes: string[] = [];
    if (/\bfamily\b/.test(lower))                           tenantTypes.push('FAMILY');
    if (/\bbachelor/.test(lower))                           tenantTypes.push('BACHELORS');
    if (/\bworking (woman|lady|ladies|women)\b/.test(lower)) tenantTypes.push('GIRLS');

    const isUrgent = /\b(urgent|immediate|asap|immediately)\b/.test(lower);

    const signalCount = [phones.length > 0, price !== null, bhk !== null, location !== null].filter(Boolean).length;
    const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
        signalCount === 3 ? 'MEDIUM' : 'LOW';

    return {
      skip: false,
      extracted: { phones, price, priceRaw, bhk, listingType, location, furnishing, tenantTypes, isUrgent, signalCount },
      confidence,
    };
  }

  private skip(reason: string): PreClassifiedResult {
    return {
      skip: true, skipReason: reason,
      extracted: { phones: [], price: null, priceRaw: null, bhk: null, listingType: null, location: null, furnishing: null, tenantTypes: [], isUrgent: false, signalCount: 0 },
      confidence: 'LOW',
    };
  }
}