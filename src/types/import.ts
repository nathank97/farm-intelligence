export interface ImportRow {
  fieldName: string;
  cropName: string;
  varietyName?: string;
  year: number;
  acreage?: number;
  soilType?: string;
  cropCategory?: string;
  yieldPerAcre?: number;
  totalYield?: number;
  plantingDate?: string;
  harvestDate?: string;
  seedCost?: number;
  fertilizerCost?: number;
  sprayCost?: number;
  operationsCost?: number;
  totalCost?: number;
  revenuePerTonne?: number;
  totalRevenue?: number;
  grossMargin?: number;
  costPerAcre?: number;
  revenuePerAcre?: number;
  notes?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  valid: ImportRow[];
  errors: ValidationError[];
}

export interface ImportSummary {
  fileName: string;
  totalRows: number;
  rowsProcessed: number;
  rowsFailed: number;
  status: 'success' | 'partial' | 'failed';
  errors: ValidationError[];
}
