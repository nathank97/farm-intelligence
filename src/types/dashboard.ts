export interface CropPerformanceData {
  fieldName: string;
  cropName: string;
  varietyName: string | null;
  year: number;
  acreage: number;
  yieldPerAcre: number | null;
  totalYield: number | null;
}

export interface FinancialSummaryData {
  fieldName: string;
  cropName: string;
  year: number;
  totalCost: number | null;
  totalRevenue: number | null;
  grossMargin: number | null;
  costPerAcre: number | null;
  revenuePerAcre: number | null;
}

export interface YieldTrendPoint {
  year: number;
  cropName: string;
  avgYieldPerAcre: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
}

export interface StatsOverview {
  totalFields: number;
  totalCrops: number;
  totalAcreage: number;
  avgYieldPerAcre: number | null;
  avgGrossMargin: number | null;
  latestYear: number | null;
}

export interface FilterOption {
  value: string;
  label: string;
}
