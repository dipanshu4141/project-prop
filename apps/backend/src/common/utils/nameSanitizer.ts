export function looksLikeGarbageName(name: string): boolean {
    if (!name) return true;
  
    const n = name.toLowerCase().trim();
  
    // placeholders / labels
    const labelWords = [
      "-",
      "mobile",
      "phone",
      "contact",
      "whatsapp",
      "call",
      "number",
    ];
  
    if (labelWords.includes(n.replace(":", ""))) return true;
  
    const badWords = [
      "broker",
      "property",
      "properties",
      "real estate",
      "estate",
      "consultant",
      "consultancy",
      "services",
      "service",
      "enterprise",
      "enterprises",
      "agency",
      "deals",
      "group",
      "developer",
      "builders",
      "construction",
      "associate",
      "associates",
    ];
  
    if (n.length < 3) return true;
  
    if (badWords.some(w => n.includes(w))) return true;
  
    if (n.split(" ").length > 3) return true;
  
    if (name === name.toUpperCase() && name.length > 10) return true;
  
    if (/\d/.test(n)) return true;
  
    return false;
  }
  