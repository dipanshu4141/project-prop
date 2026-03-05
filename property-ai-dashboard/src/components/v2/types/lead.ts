export interface Lead {
    id: string;
    propertyId: string;
  
    platform: string;
  
    targetName: string;
    targetContact: string;
  
    leadStage: "NEW" | "OPEN" | "CLOSED" | "LOST";
  
    followUpAt: string | null;
    lastContactedAt: string | null;
    sentAt: string;
  
    property?: {
      id: string;
      listingType: string;
      propertySubType: string;
      bhk: string | null;
      area: string | null;
      city: string | null;
    };
  }
  