// export function buildWhatsAppMessage(property: any, teamMembers: any[]) {
//     const lines: string[] = [];
  
//     const HOUSE = "\u{1F3E0}";
//     const PIN = "\u{1F4CD}";
//     const RULER = "\u{1F4D0}";
//     const BUILDING = "\u{1F3E2}";
//     const SOFA = "\u{1F6CB}";
//     const MONEY = "\u{1F4B0}";
//     const HANDSHAKE = "\u{1F91D}";
//     const CALENDAR = "\u{1F4C5}";
//     const PHONE = "\u{1F4DE}";
  
//     const title = `${property.bhk || ""} BHK ${
//       property.listingType === "RENT" ? "Apartment for Rent" : "Property for Sale"
//     }`.trim();
  
//     lines.push(`${HOUSE} *${title}*`);
//     lines.push("");
  
//     const locationParts = [property.area, property.building, property.city].filter(Boolean);
//     if (locationParts.length) {
//       lines.push(`${PIN} Location: ${locationParts.join(", ")}`);
//     }
  
//     if (property.areaSqft) lines.push(`${RULER} Area: ${property.areaSqft} sqft`);
//     if (property.floor) lines.push(`${BUILDING} Floor: ${property.floor}`);
//     if (property.furnishing) lines.push(`${SOFA} Furnishing: ${property.furnishing}`);
  
//     lines.push("");
  
//     if (property.price) lines.push(`${MONEY} Price: ₹${property.price}`);
//     if (property.deposit) lines.push(`${MONEY} Deposit: ₹${property.deposit}`);
//     if (property.negotiable !== null && property.negotiable !== undefined) {
//       lines.push(`${HANDSHAKE} Negotiable: ${property.negotiable ? "Yes" : "No"}`);
//     }
  
//     if (property.availableFrom) {
//       lines.push(`${CALENDAR} Available From: ${new Date(property.availableFrom).toLocaleDateString()}`);
//     }
  
//     lines.push("");
//     lines.push("----------------------");
//     lines.push(`${PHONE} *Contact for Visit:*`);
//     lines.push("");
  
//     teamMembers.forEach((m, i) => {
//       lines.push(`${i + 1}) ${m.name} - ${m.phone}`);
//     });
  
//     lines.push("----------------------");
  
//     return lines.join("\n");
//   }
  

/* --------------------------------------------
   WhatsApp Message Builder Utilities
--------------------------------------------- */

// export function buildWhatsAppMessage(
//   property: any,
//   team: any[],
//   clientName?: string
// ) {
//   let msg = `Hi ${clientName || ""} 👋\n\n`;

//   msg += `Here is a property option shortlisted for you 👇\n\n`;

//   msg += `🏠 *${property.propertySubType}*\n`;
//   msg += `📍 ${property.location || property.city || "Location on request"}\n`;
//   msg += `💰 ${
//     property.listingType === "RENT" ? "Rent" : "Price"
//   }: ₹${property.price}\n`;
//   msg += `📐 Area: ${
//     property.areaSqft ? `${property.areaSqft} sqft` : "—"
//   }\n`;
//   msg += `🪑 Furnishing: ${property.furnishing || "—"}\n`;
//   msg += `👨‍👩‍👧‍👦 Tenant Preference: ${
//     property.tenantTypes?.join(", ") || "Any"
//   }\n\n`;

//   msg += `✨ *“Right property at the right time can change everything.”*\n\n`;

//   if (team.length > 0) {
//     msg += `📞 *For site visit & negotiation:*\n`;
//     team.forEach((m) => {
//       msg += `👉 *${m.name}* — ${m.phone}\n`;
//     });
//     msg += `\n`;
//   }

//   msg += `Let me know if you’d like to visit this property 😊`;

//   return msg;
// }

// /* --------------------------------------------
//    MULTIPLE PROPERTIES
// --------------------------------------------- */

// export function buildWhatsAppMessageForMultiple(
//   properties: any[],
//   team: any[],
//   clientName?: string
// ) {
//   let msg = `Hi ${clientName || ""} 👋\n\n`;

//   msg +=
//     `I’ve shortlisted some very good property options for you based on your requirement.\nPlease have a look 👇\n\n`;

//   properties.forEach((p, i) => {
//     msg += `────────────────\n`;
//     msg += `🏠 *Option ${i + 1}*\n`;
//     msg += `📌 *${p.propertySubType}*\n`;
//     msg += `📍 ${p.location || p.city || "Location on request"}\n`;
//     msg += `💰 ${
//       p.listingType === "RENT" ? "Rent" : "Price"
//     }: ₹${p.price}\n`;
//     msg += `📐 Area: ${
//       p.areaSqft ? `${p.areaSqft} sqft` : "—"
//     }\n`;
//     msg += `🪑 Furnishing: ${p.furnishing || "—"}\n`;
//     msg += `👨‍👩‍👧‍👦 Tenant Preference: ${
//       p.tenantTypes?.join(", ") || "Any"
//     }\n\n`;
//   });

//   msg += `✨ *“Right property at the right time can change everything.”*\n\n`;

//   if (team.length > 0) {
//     msg += `📞 *For site visit & negotiation:*\n`;
//     team.forEach((m) => {
//       msg += `👉 *${m.name}* — ${m.phone}\n`;
//     });
//     msg += `\n`;
//   }

//   msg += `Please let me know which option you like — I’ll arrange a visit immediately 😊`;

//   return msg;
// }







// export function buildWhatsAppMessageForMultiple(
//   properties: any[],
//   team: any[],
//   clientName?: string
// ) {
//   let msg = `Hi ${clientName || ""} 👋\n\n`;

//   msg +=
//     `I’ve shortlisted some very good property options for you based on your requirement.\nPlease have a look 👇\n\n`;

//   properties.forEach((p, i) => {
//     msg += `────────────────\n`;
//     msg += `🏠 *Option ${i + 1}*\n`;

//     // 🏢 Property / Building Identity
//     msg += `📌 *${p.propertySubType || p.propertyType || "Property"}*\n`;

//     if (p.buildingName || p.societyName || p.projectName) {
//       msg += `🏢 Building: ${
//         p.buildingName || p.societyName || p.projectName
//       }\n`;
//     }

//     msg += `📍 Location: ${
//       p.location || p.area || p.locality || p.city || "On request"
//     }\n`;

//     // 💰 Pricing & Listing Type
//     if (p.listingType) {
//       msg += `📄 Listing Type: ${p.listingType}\n`;
//     }

//     msg += `💰 ${
//       p.listingType === "RENT" ? "Rent" : "Price"
//     }: ₹${p.price || "On request"}\n`;

//     if (p.deposit) msg += `🔐 Deposit: ₹${p.deposit}\n`;
//     if (p.maintenance) msg += `🧾 Maintenance: ₹${p.maintenance}\n`;

//     // 📐 Area Details (ALL)
//     if (p.areaSqft) msg += `📐 Area: ${p.areaSqft} sqft\n`;
//     if (p.builtUpArea) msg += `📐 Built-up Area: ${p.builtUpArea} sqft\n`;
//     if (p.carpetArea) msg += `📐 Carpet Area: ${p.carpetArea} sqft\n`;
//     if (p.plotArea) msg += `📐 Plot Area: ${p.plotArea} sqft\n`;

//     // 🛏️ Configuration
//     if (p.bhk) msg += `🛏️ BHK: ${p.bhk}\n`;
//     if (p.bedrooms) msg += `🛏️ Bedrooms: ${p.bedrooms}\n`;
//     if (p.bathrooms) msg += `🚿 Bathrooms: ${p.bathrooms}\n`;
//     if (p.balconies) msg += `🌤️ Balconies: ${p.balconies}\n`;

//     // 🏢 Floor Info
//     if (p.floor) msg += `🏢 Floor: ${p.floor}\n`;
//     if (p.totalFloors) msg += `🏢 Total Floors: ${p.totalFloors}\n`;

//     // 🪑 Furnishing & Condition
//     if (p.furnishing) msg += `🪑 Furnishing: ${p.furnishing}\n`;
//     if (p.condition) msg += `🛠️ Condition: ${p.condition}\n`;
//     if (p.age) msg += `🏗️ Property Age: ${p.age} years\n`;

//     // 🧭 Direction & Vastu
//     if (p.facing) msg += `🧭 Facing: ${p.facing}\n`;
//     if (p.vastuCompliant !== undefined) {
//       msg += `🕉️ Vastu: ${p.vastuCompliant ? "Yes" : "No"}\n`;
//     }

//     // 🚗 Parking
//     if (p.parking) msg += `🚗 Parking: ${p.parking}\n`;
//     if (p.parkingCount) msg += `🚗 Parking Count: ${p.parkingCount}\n`;

//     // 👥 Tenant / Usage Preferences
//     if (Array.isArray(p.tenantType) && p.tenantType.length > 0) {
//       msg += `👥 Preferred Tenants: ${p.tenantType.join(", ")}\n`;
//     }

//     if (Array.isArray(p.restrictions) && p.restrictions.length > 0) {
//       msg += `⚠️ Restrictions: ${p.restrictions.join(", ")}\n`;
//     }

//     if (p.usageType) msg += `🏷️ Usage: ${p.usageType}\n`;

//     // 📅 Availability & Urgency
//     if (p.availability) msg += `📅 Availability: ${p.availability}\n`;
//     if (p.availableFrom) msg += `📆 Available From: ${p.availableFrom}\n`;
//     if (p.urgency) msg += `🔥 Urgency: ${p.urgency}\n`;

//     // 🏘️ Society / Amenities
//     if (Array.isArray(p.amenities) && p.amenities.length > 0) {
//       msg += `🏘️ Amenities: ${p.amenities.join(", ")}\n`;
//     }

//     // 📝 Notes / Description
//     if (p.notes) msg += `📝 Notes: ${p.notes}\n`;
//     if (p.description) msg += `📝 Description: ${p.description}\n`;

//     /*
//       ⚠️ TESTING ONLY — PROPERTY AGENTS
//       This section is added only for testing purposes.
//       It will be removed later.
//     */
//     if (Array.isArray(p.agents) && p.agents.length > 0) {
//       msg += `\n👤 *Property Agents (Testing Only)*\n`;
//       p.agents.forEach((a: any) => {
//         const phones =
//           Array.isArray(a.phones) && a.phones.length > 0
//             ? a.phones
//                 .map((ph: any) =>
//                   ph.isPrimary ? `${ph.phone} (Primary)` : ph.phone
//                 )
//                 .filter(Boolean)
//                 .join(", ")
//             : "Phone on request";
//         msg += `👉 ${a.name || "Agent"} — ${phones}\n`;
//       });
//     }

//     msg += `\n`;
//   });

//   // 📞 OFFICIAL TEAM (PERMANENT)
//   if (Array.isArray(team) && team.length > 0) {
//     msg += `────────────────\n`;
//     msg += `📞 *For site visit, negotiation & assistance:*\n`;
//     team.forEach((m) => {
//       msg += `👉 *${m.name}* — ${m.phone}\n`;
//     });
//     msg += `\n`;
//   }

//   msg += `✨ *“Right property at the right time can change everything.”*\n\n`;
//   msg += `Please let me know which option you like — I’ll arrange a visit immediately 😊`;

//   return msg;
// }



// apps/dashboard/src/utils/buildWhatsAppMessage.ts
// Builds WhatsApp-formatted messages for property sharing.
// Uses *bold* and _italic_ — standard WhatsApp markdown.

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageProperty = {
  id:              string;
  bhk?:            string | number | null;
  propertySubType?: string | null;
  city?:           string | null;
  area?:           string | null;       // locality / neighbourhood
  price?:          string | number | null;
  areaSqft?:       number | null;
  listingType?:    string | null;       // RENT | SALE
  [key: string]:   unknown;
};

export type MessageSender = {
  id:      string;
  name:    string;
  phone?:  string | null;
  isSelf?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const NUMBER_EMOJI = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

const SUBTYPE_EMOJI: Record<string, string> = {
  APARTMENT: '🏢',
  VILLA:     '🏡',
  OFFICE:    '🏢',
  SHOP:      '🏪',
  WAREHOUSE: '🏭',
  SHOWROOM:  '🏪',
  PLOT:      '🗺️',
  OTHER:     '🏠',
};

const SUBTYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA:     'Villa',
  OFFICE:    'Office Space',
  SHOP:      'Shop',
  WAREHOUSE: 'Warehouse',
  SHOWROOM:  'Showroom',
  PLOT:      'Plot',
  OTHER:     'Property',
};

function formatPrice(price: string | number | null | undefined): string {
  if (price == null || price === '') return '';
  const n = Number(price);
  if (isNaN(n) || n <= 0) return '';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function propertyTitle(p: MessageProperty): string {
  const bhk   = p.bhk ? `${p.bhk} BHK ` : '';
  const type  = p.propertySubType
    ? (SUBTYPE_LABEL[(p.propertySubType as string).toUpperCase()] ?? 'Property')
    : 'Property';
  return `${bhk}${type}`;
}

function propertyEmoji(p: MessageProperty): string {
  const key = (p.propertySubType ?? '').toString().toUpperCase();
  return SUBTYPE_EMOJI[key] ?? '🏠';
}

function buildPropertyBlock(p: MessageProperty, index: number): string {
  const num      = NUMBER_EMOJI[index] ?? `${index + 1}.`;
  const emoji    = propertyEmoji(p);
  const title    = propertyTitle(p);
  const location = [p.area, p.city].filter(Boolean).join(', ');
  const price    = formatPrice(p.price);
  const rent     = p.listingType === 'RENT';
  const priceLabel = price
    ? rent ? `💰 ${price}/mo` : `💰 ${price}`
    : '';

  const lines: string[] = [`${num} ${emoji} *${title}*`];
  if (location) lines.push(`    📍 ${location}`);
  if (priceLabel) lines.push(`    ${priceLabel}`);
  return lines.join('\n');
}

function buildSignature(senders: MessageSender[]): string {
  if (senders.length === 0) return '';

  const lines: string[] = [];

  if (senders.length === 1) {
    const s = senders[0];
    lines.push(`— *${s.name}*`);
    if (s.phone) lines.push(`📞 ${s.phone}`);
  } else {
    lines.push('— *Your property team:*');
    for (const s of senders) {
      const phone = s.phone ? ` · ${s.phone}` : '';
      lines.push(`  • ${s.name}${phone}`);
    }
  }

  return lines.join('\n');
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Builds a rich, WhatsApp-formatted property sharing message.
 *
 * @param properties  - Array of WorkspaceListing-shaped objects
 * @param senders     - Team members sending the message
 * @param clientName  - Optional client first name for personalised greeting
 * @param shareUrl    - Optional portal link (included when a CRM client is linked)
 */
export function buildWhatsAppMessageForMultiple(
  properties:  MessageProperty[],
  senders:     MessageSender[],
  clientName?: string,
  shareUrl?:   string | null,
): string {
  const firstName = clientName?.trim().split(' ')[0] ?? '';
  const greeting  = firstName ? `Hi ${firstName}! 👋` : 'Hi! 👋';
  const count     = properties.length;
  const plural    = count === 1 ? 'property' : 'properties';

  const intro = count === 1
    ? `I've selected a *${propertyTitle(properties[0])}* for you:`
    : `I've handpicked *${count} ${plural}* for you:`;

  const propertyBlocks = properties
    .map((p, i) => buildPropertyBlock(p, i))
    .join('\n\n');

  const parts: string[] = [
    greeting,
    '',
    intro,
    '',
    propertyBlocks,
  ];

  // Share portal link
  if (shareUrl) {
    parts.push('');
    parts.push('Tap below to tell me which ones interest you 👇');
    parts.push(`🔗 ${shareUrl}`);
  }

  // Sender signature
  const sig = buildSignature(senders);
  if (sig) {
    parts.push('');
    parts.push(sig);
  }

  return parts.join('\n');
}