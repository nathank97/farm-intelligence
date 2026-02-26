/**
 * Import Types — Unified for Corn, Edibles, and Field P&L
 *
 * Supports auto-detection of file type from column headers.
 * Each file format has its own row type and column map.
 */

// =============================================================================
// File Type Detection
// =============================================================================

export type ImportFileType = "corn" | "edibles" | "field_pl";

/**
 * Detects which file type is being uploaded by examining column headers.
 * Looks for distinctive columns unique to each file.
 */
export function detectFileType(headers: string[]): ImportFileType | null {
  const headerSet = new Set(headers.map((h) => h.trim()));

  // Corn: has "Seed Company", "Test Weight", "Wet Bushel"
  if (headerSet.has("Seed Company") && headerSet.has("Test Weight")) return "corn";

  // Edibles: has "Skin CK", "FM", "Gross Units" — unique dockage columns
  if (headerSet.has("Skin CK") || headerSet.has("FM Dock")) return "edibles";

  // Field P&L: has "Crop Sale", "Total Cost/Ac", "ROI"
  if (headerSet.has("Crop Sale") || headerSet.has("Total Cost/Ac")) return "field_pl";

  return null;
}

// =============================================================================
// Common Types
// =============================================================================

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ParseResult {
  fileType: ImportFileType;
  valid: CornLoadImportRow[] | EdibleLoadImportRow[] | FieldPLImportRow[];
  errors: ValidationError[];
  totalRows: number;
}

export interface ImportResult {
  rowsProcessed: number;
  rowsFailed: number;
  errors: ValidationError[];
  importLogId: string;
  fileType: ImportFileType;
}

// =============================================================================
// Corn Load Row
// =============================================================================

export interface CornLoadImportRow {
  year: number;
  nominalPlantDate: string | null;
  nominalHarvestDate: string | null;
  plantingDate: string | null;
  harvestDate: string | null;
  fieldNumber: number;
  fieldName: string;
  acres: number;
  seedCompany: string;
  variety: string | null;
  patternTile: number | null;
  cornType: string;
  deliveredTo: string | null;
  testWeight: number | null;
  moisture: number | null;
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  wetBushel: number | null;
  dryBushel: number | null;
  commonDryBushel: number | null;
  shrink: number | null;
  dmTons: number | null;
  origTpa: number | null;
  adjTpa: number | null;
  wetYield: number | null;
  dryYield: number | null;
  commonDryYield: number | null;
  finalPrice: number | null;
  rainAprSep: number | null;
  rainMayAug: number | null;
}

export const CORN_COLUMN_MAP: Record<string, keyof CornLoadImportRow> = {
  "Year": "year",
  "Nominal Plant Date": "nominalPlantDate",
  "Nominal Harvest Date": "nominalHarvestDate",
  "Planting Date": "plantingDate",
  "Harvest Date": "harvestDate",
  "Field #": "fieldNumber",
  "Field Number": "fieldNumber",
  "Field": "fieldName",
  "Acres": "acres",
  "Seed Company": "seedCompany",
  "Variety": "variety",
  "Pattern Tile": "patternTile",
  "Type": "cornType",
  "Delivered to": "deliveredTo",
  "Delivered To": "deliveredTo",
  "Test Weight": "testWeight",
  "Moisture": "moisture",
  "Gross Weight": "grossWeight",
  "Tare Weight": "tareWeight",
  "Net Weight": "netWeight",
  "Wet Bushel": "wetBushel",
  "Dry Bushel": "dryBushel",
  "Common Dry Bushel": "commonDryBushel",
  "Shrink": "shrink",
  "DM Tons": "dmTons",
  "Orig. TPA": "origTpa",
  "Adj. TPA": "adjTpa",
  "Wet Yield": "wetYield",
  "Dry Yield": "dryYield",
  "Common Dry Yield": "commonDryYield",
  "Final Price": "finalPrice",
  "April 1-Sept 1 Rain": "rainAprSep",
  "May 15-Aug 1 Rain": "rainMayAug",
};

export const CORN_REQUIRED: (keyof CornLoadImportRow)[] = [
  "year", "fieldNumber", "fieldName", "acres", "seedCompany", "cornType",
];

export const CORN_TYPE_MAP: Record<string, string> = {
  "Dry Corn": "DRY_CORN",
  "Silage": "SILAGE",
  "High Moisture Corn": "HIGH_MOISTURE_CORN",
  "Organic Corn": "ORGANIC_CORN",
  "Earlage": "EARLAGE",
};

// =============================================================================
// Edible Load Row
// =============================================================================

export interface EdibleLoadImportRow {
  year: number;
  plantingDate: string | null;
  nominalPlantDate: string | null;
  harvestDate: string | null;
  nominalHarvestDate: string | null;
  fieldName: string;
  acres: number;
  variety: string | null;
  patternTile: number | null;
  refNumber: number | null;
  beanType: string;
  // Quality: Moisture
  moisture: number | null;
  moistDock: number | null;
  avgMoisture: number | null;
  moistDollarDocked: number | null;
  moistPerAcDocked: number | null;
  // Quality: Damage
  damage: number | null;
  damageDock: number | null;
  avgDamage: number | null;
  damageDollarDocked: number | null;
  damagePerAcDocked: number | null;
  // Quality: FM
  fm: number | null;
  fmDock: number | null;
  avgFm: number | null;
  fmDollarDocked: number | null;
  fmPerAcDocked: number | null;
  // Quality: Skin Checks
  skinCheck: number | null;
  checksDock: number | null;
  avgSkinCheck: number | null;
  skinCheckDollarDocked: number | null;
  skinCheckPerAc: number | null;
  // Quality: Sprouts/Splits
  sproutsSplits: number | null;
  splitsDock: number | null;
  avgSproutsSplits: number | null;
  sproutsDollarDocked: number | null;
  sproutsPerAcDocked: number | null;
  // Dockage totals
  grossUnits: number | null;
  dockedUnits: number | null;
  shrink: number | null;
  dockPlusShrink: number | null;
  netUnits: number | null;
  // Yield
  yield: number | null;
  // Financial
  totalDollarDocked: number | null;
  perAcDocked: number | null;
  finalPrice: number | null;
  // Rainfall
  rainAprSep: number | null;
  rainMayAug: number | null;
}

export const EDIBLE_COLUMN_MAP: Record<string, keyof EdibleLoadImportRow> = {
  "Year": "year",
  "Planting Date": "plantingDate",
  "Nominal Plant Date": "nominalPlantDate",
  "Harvest Date": "harvestDate",
  "Nominal Harvest Date": "nominalHarvestDate",
  "Field": "fieldName",
  "Acres": "acres",
  "Variety": "variety",
  "Pattern Tile": "patternTile",
  "Ref #": "refNumber",
  "Type": "beanType",
  "Moisture": "moisture",
  "Moist. Dock": "moistDock",
  "Avg. Moisture": "avgMoisture",
  "Moist $ Docked": "moistDollarDocked",
  "Moist $/Ac Docked": "moistPerAcDocked",
  "Damage": "damage",
  "Dmge. Dock": "damageDock",
  "Avg. Damage": "avgDamage",
  "$ Docked for Damage": "damageDollarDocked",
  "Damage $/Ac Docked": "damagePerAcDocked",
  "FM": "fm",
  "FM Dock": "fmDock",
  "Avg. FM": "avgFm",
  "$ Docked for FM": "fmDollarDocked",
  "FM $/Ac Docked": "fmPerAcDocked",
  "Skin CK": "skinCheck",
  "Checks Dock": "checksDock",
  "Avg. SC": "avgSkinCheck",
  "$ Docked for Skin Checks": "skinCheckDollarDocked",
  "Skin Check $/Ac": "skinCheckPerAc",
  "Sprouts/Splits": "sproutsSplits",
  "Splts. Dock": "splitsDock",
  "Avg. Splits/Sprouts": "avgSproutsSplits",
  "$ Docked for Sprouts/ Splits": "sproutsDollarDocked",
  "Sprouts/Splits $/Ac Docked": "sproutsPerAcDocked",
  "Gross Units": "grossUnits",
  "Docked Units": "dockedUnits",
  "Shrink": "shrink",
  "Dock+Shrink": "dockPlusShrink",
  "Net Units": "netUnits",
  "Yield": "yield",
  "Total $ Docked": "totalDollarDocked",
  "$/Ac Docked": "perAcDocked",
  "Final Price": "finalPrice",
  "April 1-Sept 1 Rain": "rainAprSep",
  "May 15-Aug 1 Rain": "rainMayAug",
};

export const EDIBLE_REQUIRED: (keyof EdibleLoadImportRow)[] = [
  "year", "fieldName", "acres", "beanType",
];

export const BEAN_TYPE_MAP: Record<string, string> = {
  "Blacks": "BLACKS",
  "Dark Reds": "DARK_REDS",
  "Light Reds": "LIGHT_REDS",
  "Organic Blacks": "ORGANIC_BLACKS",
  "Organic Dark Reds": "ORGANIC_DARK_REDS",
  "Pintos": "PINTOS",
  "Small Reds": "SMALL_REDS",
  "Whites": "WHITES",
};

// =============================================================================
// Field P&L Row
// =============================================================================

export interface FieldPLImportRow {
  year: number;
  fieldName: string;
  fieldNumber: number;
  areaCode: number | null;
  acres: number;
  crop: string;
  yield: number | null;
  totalProduction: number | null;
  pricePerUnit: number | null;
  cropSale: number | null;
  govPayments: number | null;
  miscIncome: number | null;
  hedging: number | null;
  interestPatronage: number | null;
  insuranceIncome: number | null;
  totalIncPerAcre: number | null;
  machineLaborCost: number | null;
  chemicalsCost: number | null;
  seedCost: number | null;
  fertilizerCost: number | null;
  rentCost: number | null;
  landImprovCost: number | null;
  insuranceExpense: number | null;
  miscExpense: number | null;
  totalCostPerAcre: number | null;
  profitPerAcreByCrop: number | null;
  totalNetByCrop: number | null;
  profitPerAcreByField: number | null;
  roi: number | null;
  breakevenUnitsPerAcre: number | null;
  breakevenPricePerUnit: number | null;
  rentAvgAdjust: number | null;
  goingRent: number | null;
  adjProfitPerAcre: number | null;
  adjTotalNet: number | null;
  adjProfitByField: number | null;
  dataQuality: string | null;
  comments: string | null;
  status: string | null;
}

export const PL_COLUMN_MAP: Record<string, keyof FieldPLImportRow> = {
  "Year": "year",
  "Field Name": "fieldName",
  "Field #": "fieldNumber",
  "Area Code": "areaCode",
  "Acres": "acres",
  "Crop": "crop",
  "Yield": "yield",
  "Total Production": "totalProduction",
  "$/Crop Unit": "pricePerUnit",
  "Crop Sale": "cropSale",
  "Government Payments": "govPayments",
  "Misc Inc-Straw": "miscIncome",
  "Hedging": "hedging",
  "Interest-Patronage": "interestPatronage",
  "Insurance": "insuranceIncome",
  "Total Inc/Acre": "totalIncPerAcre",
  "Machine Lease/Labor": "machineLaborCost",
  "Chemicals": "chemicalsCost",
  "Seed": "seedCost",
  "Fertilizer": "fertilizerCost",
  "Rent": "rentCost",
  "Land Improv": "landImprovCost",
  "Insurance Exp.": "insuranceExpense",
  "Misc Exp": "miscExpense",
  "Total Cost/Ac": "totalCostPerAcre",
  "$/Ac By Crop": "profitPerAcreByCrop",
  "Total Net $ By Crop": "totalNetByCrop",
  "$/Ac By Field": "profitPerAcreByField",
  "ROI": "roi",
  "Unit/Ac": "breakevenUnitsPerAcre",
  "$/Unit": "breakevenPricePerUnit",
  "Rent Avg. Adjust.": "rentAvgAdjust",
  "Going Rent": "goingRent",
  "Adjusted $/Ac By Crop": "adjProfitPerAcre",
  "Adjust Total Net": "adjTotalNet",
  "Adjust $/Ac By Field": "adjProfitByField",
  "Data Quality: 1-5": "dataQuality",
  "Comments": "comments",
  "Status": "status",
};

export const PL_REQUIRED: (keyof FieldPLImportRow)[] = [
  "year", "fieldName", "fieldNumber", "acres", "crop",
];

/**
 * Maps P&L crop names to CropCategory enum values.
 */
export const CROP_CATEGORY_MAP: Record<string, string> = {
  "Dry Corn": "CORN",
  "Silage": "CORN",
  "HM Corn": "CORN",
  "Organic Corn": "CORN",
  "Earlage": "CORN",
  "Popcorn": "CORN",
  "Blacks": "EDIBLE_BEAN",
  "Dark Reds": "EDIBLE_BEAN",
  "Light Reds": "EDIBLE_BEAN",
  "Organic Blacks": "EDIBLE_BEAN",
  "Organic Dark Reds": "EDIBLE_BEAN",
  "Pintos": "EDIBLE_BEAN",
  "Small Reds": "EDIBLE_BEAN",
  "Whites": "EDIBLE_BEAN",
  "Natto Beans": "EDIBLE_BEAN",
  "Food Grade Soybeans": "GRAIN",
  "Soybeans": "GRAIN",
  "Organic Soybeans": "GRAIN",
  "Spring Wheat": "GRAIN",
  "Winter Wheat": "GRAIN",
  "Organic Wheat": "GRAIN",
  "Transition Wheat": "GRAIN",
  "Baled Wheat": "GRAIN",
  "Winter Wheat/Alfalfa": "GRAIN",
  "Sugarbeets": "SPECIALTY",
  "Carrots": "SPECIALTY",
  "Prevent Plant": "SPECIALTY",
  "Alfalfa": "FORAGE",
  "Alfalfa-Transition": "FORAGE",
  "Teff Grass": "FORAGE",
  "Organic Sudan Grass": "FORAGE",
};
