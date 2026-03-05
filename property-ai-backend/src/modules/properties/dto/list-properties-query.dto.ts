export type DatePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_14_DAYS'
  | 'LAST_30_DAYS';

export class ListPropertiesQueryDto {
  type?: string;
  status?: string;
  availability?: string;
  location?: string;
  building?: string;

  bhk?: string;
  minPrice?: string;
  maxPrice?: string;

  /* ---------- DATE FILTER ---------- */
  datePreset?: DatePreset;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD

  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  page?: string;
  limit?: string;
}
