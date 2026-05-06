// ================= TENANT TYPES =================

export const TENANT_TYPES = [
    "BACHELORS",
    "FAMILY",
    "GIRLS",
    "BOYS",
    "ANY",
  ] as const;
  
  export type TenantType = typeof TENANT_TYPES[number];
  
  // ================= TENANT RESTRICTIONS =================
  
  export const TENANT_RESTRICTIONS = [
    { code: "ONLY_HINDU", label: "Only Hindu" },
    { code: "ONLY_MUSLIM", label: "Only Muslim" },
    { code: "ONLY_VEGETARIAN", label: "Only Vegetarian" },
    { code: "NO_PETS", label: "No Pets" },
    { code: "WORKING_PROFESSIONALS", label: "Working Professionals" },
    { code: "ONLY_MARRIED", label: "Only Married" },
    { code: "ONLY_GUJARATI", label: "Only Gujarati" },
    { code: "ONLY_JAIN", label: "Only Jain" },
  ];
  
  export const ALLOWED_RESTRICTION_CODES = new Set(
    TENANT_RESTRICTIONS.map(r => r.code)
  );
  