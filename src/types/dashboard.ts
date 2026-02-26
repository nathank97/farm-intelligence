/**
 * Dashboard Types — Unified
 *
 * Covers corn performance, edible bean quality, and field P&L analytics.
 */

// =============================================================================
// Shared
// =============================================================================

export interface StatCardData {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "flat";
  unit?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface UnifiedDashboardFilters {
  year?: number;
  fieldId?: string;
  cropCategory?: string; // CORN, EDIBLE_BEAN, GRAIN, etc.
  cornType?: string;
  beanType?: string;
  seedCompany?: string;
  crop?: string; // For P&L: specific crop name
}

// =============================================================================
// Corn Dashboard
// =============================================================================

export interface CornFieldSeason {
  fieldName: string;
  fieldNumber: number;
  year: number;
  acres: number;
  cornType: string;
  seedCompany: string;
  variety: string | null;
  loadCount: number;
  totalNetWeight: number | null;
  avgMoisture: number | null;
  avgTestWeight: number | null;
  totalDryBushel: number | null;
  avgDryYield: number | null;
  avgCommonDryYield: number | null;
  totalDmTons: number | null;
  avgAdjTpa: number | null;
  avgShrink: number | null;
}

export interface CornYieldTrend {
  year: number;
  avgDryYield: number;
  avgMoisture: number;
  avgTestWeight: number;
  totalLoads: number;
  fieldCount: number;
  rainAprSep: number | null;
  rainMayAug: number | null;
}

// =============================================================================
// Edible Bean Dashboard
// =============================================================================

export interface EdibleFieldSeason {
  fieldName: string;
  year: number;
  acres: number;
  beanType: string;
  variety: string | null;
  loadCount: number;
  avgMoisture: number | null;
  avgDamage: number | null;
  avgFm: number | null;
  avgSkinCheck: number | null;
  avgSproutsSplits: number | null;
  totalGrossUnits: number | null;
  totalNetUnits: number | null;
  yield: number | null;
  totalDollarDocked: number | null;
  perAcDocked: number | null;
  finalPrice: number | null;
}

export interface EdibleYieldTrend {
  year: number;
  beanType: string;
  avgYield: number;
  avgPerAcDocked: number;
  loadCount: number;
  fieldCount: number;
}

export interface DockageBreakdown {
  category: string; // "Moisture", "Damage", "FM", "Skin Checks", "Sprouts/Splits"
  avgValue: number;
  totalDollarDocked: number;
  avgPerAcDocked: number;
}

// =============================================================================
// Financial Dashboard (from Field P&L)
// =============================================================================

export interface FieldPLSummary {
  fieldName: string;
  fieldNumber: number;
  year: number;
  acres: number;
  crop: string;
  cropCategory: string;
  yield: number | null;
  totalIncPerAcre: number | null;
  totalCostPerAcre: number | null;
  profitPerAcreByCrop: number | null;
  totalNetByCrop: number | null;
  roi: number | null;
  dataQuality: string | null;
}

export interface CropProfitability {
  crop: string;
  cropCategory: string;
  yearCount: number;
  fieldCount: number;
  avgYield: number;
  avgIncomePerAcre: number;
  avgCostPerAcre: number;
  avgProfitPerAcre: number;
  avgRoi: number;
  totalAcres: number;
}

export interface ExpenseBreakdown {
  category: string; // "Machine/Labor", "Chemicals", "Seed", "Fertilizer", "Rent", etc.
  amount: number;
  percentage: number;
}

export interface RevenueBreakdown {
  category: string; // "Crop Sale", "Gov Payments", "Insurance", etc.
  amount: number;
  percentage: number;
}

export interface YearOverYearFinancial {
  year: number;
  avgIncomePerAcre: number;
  avgCostPerAcre: number;
  avgProfitPerAcre: number;
  totalNetProfit: number;
  cropCount: number;
}

// =============================================================================
// Integrated Analytics
// =============================================================================

export interface FieldRanking {
  fieldName: string;
  fieldNumber: number;
  yearsOfData: number;
  avgProfitPerAcre: number;
  avgYield: number;
  totalAcres: number;
  primaryCrop: string;
  bestYear: number;
  worstYear: number;
}

export interface RainfallCorrelation {
  year: number;
  rainAprSep: number;
  rainMayAug: number;
  avgCornYield: number | null;
  avgBeanYield: number | null;
  avgProfitPerAcre: number | null;
}
