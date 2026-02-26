/**
 * Import Service — Unified
 *
 * Handles import of all 3 file types:
 *   1. Auto-detects file type from headers
 *   2. Routes to the correct parser
 *   3. Upserts reference data, bulk creates fact records
 *
 * All 3 files share the dual-header pattern (row 1 = categories, row 2 = headers).
 */

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma/client";
import { CornType, BeanType, CropCategory, Prisma } from "@prisma/client";
import type {
  ImportFileType,
  CornLoadImportRow,
  EdibleLoadImportRow,
  FieldPLImportRow,
  ValidationError,
  ParseResult,
  ImportResult,
} from "@/types/import";
import {
  detectFileType,
  CORN_COLUMN_MAP, CORN_REQUIRED, CORN_TYPE_MAP,
  EDIBLE_COLUMN_MAP, EDIBLE_REQUIRED, BEAN_TYPE_MAP,
  PL_COLUMN_MAP, PL_REQUIRED, CROP_CATEGORY_MAP,
} from "@/types/import";

// =============================================================================
// Main Entry Point
// =============================================================================

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = findDataSheet(workbook);

  if (!sheetName) {
    return { fileType: "corn", valid: [], errors: [{ row: 0, field: "", message: "No usable data sheet found" }], totalRows: 0 };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  if (rawData.length < 3) {
    return { fileType: "corn", valid: [], errors: [{ row: 0, field: "", message: "Sheet needs at least 3 rows" }], totalRows: 0 };
  }

  // Row 1 = categories (skip), Row 2 = actual headers
  const headerRow = (rawData[1] as (string | null)[]).map((h) => (h ? String(h).trim() : ""));
  const fileType = detectFileType(headerRow);

  if (!fileType) {
    return { fileType: "corn", valid: [], errors: [{ row: 0, field: "", message: "Could not detect file type from column headers. Expected Corn, Edibles, or Field P&L format." }], totalRows: 0 };
  }

  switch (fileType) {
    case "corn":
      return parseCornRows(rawData, headerRow, fileType);
    case "edibles":
      return parseEdibleRows(rawData, headerRow, fileType);
    case "field_pl":
      return parsePLRows(rawData, headerRow, fileType);
  }
}

/** Finds the primary data sheet. Prefers "Full Assembly Sheet" or "Master". */
function findDataSheet(workbook: XLSX.WorkBook): string | null {
  const names = workbook.SheetNames;
  const preferred = ["Full Assembly Sheet", "Master"];
  for (const p of preferred) {
    if (names.includes(p)) return p;
  }
  return names[0] ?? null;
}

// =============================================================================
// Corn Parser
// =============================================================================

function parseCornRows(rawData: unknown[][], headers: string[], fileType: ImportFileType): ParseResult {
  const colMap = buildColMap(headers, CORN_COLUMN_MAP);
  const rows: CornLoadImportRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 2; i < rawData.length; i++) {
    const raw = rawData[i] as unknown[];
    if (!raw || isEmptyRow(raw)) continue;
    const rowNum = i + 1;

    const mapped: CornLoadImportRow = {
      year: toInt(getVal(raw, colMap, "year")) ?? 0,
      nominalPlantDate: toDateStr(getVal(raw, colMap, "nominalPlantDate")),
      nominalHarvestDate: toDateStr(getVal(raw, colMap, "nominalHarvestDate")),
      plantingDate: toDateStr(getVal(raw, colMap, "plantingDate")),
      harvestDate: toDateStr(getVal(raw, colMap, "harvestDate")),
      fieldNumber: toInt(getVal(raw, colMap, "fieldNumber")) ?? 0,
      fieldName: toStr(getVal(raw, colMap, "fieldName")),
      acres: toNum(getVal(raw, colMap, "acres")) ?? 0,
      seedCompany: toStr(getVal(raw, colMap, "seedCompany")),
      variety: toOptStr(getVal(raw, colMap, "variety")),
      patternTile: toOptInt(getVal(raw, colMap, "patternTile")),
      cornType: toStr(getVal(raw, colMap, "cornType")),
      deliveredTo: toOptStr(getVal(raw, colMap, "deliveredTo")),
      testWeight: toOptNum(getVal(raw, colMap, "testWeight")),
      moisture: toOptNum(getVal(raw, colMap, "moisture")),
      grossWeight: toOptNum(getVal(raw, colMap, "grossWeight")),
      tareWeight: toOptNum(getVal(raw, colMap, "tareWeight")),
      netWeight: toOptNum(getVal(raw, colMap, "netWeight")),
      wetBushel: toOptNum(getVal(raw, colMap, "wetBushel")),
      dryBushel: toOptNum(getVal(raw, colMap, "dryBushel")),
      commonDryBushel: toOptNum(getVal(raw, colMap, "commonDryBushel")),
      shrink: toOptNum(getVal(raw, colMap, "shrink")),
      dmTons: toOptNum(getVal(raw, colMap, "dmTons")),
      origTpa: toOptNum(getVal(raw, colMap, "origTpa")),
      adjTpa: toOptNum(getVal(raw, colMap, "adjTpa")),
      wetYield: toOptNum(getVal(raw, colMap, "wetYield")),
      dryYield: toOptNum(getVal(raw, colMap, "dryYield")),
      commonDryYield: toOptNum(getVal(raw, colMap, "commonDryYield")),
      finalPrice: toOptNum(getVal(raw, colMap, "finalPrice")),
      rainAprSep: toOptNum(getVal(raw, colMap, "rainAprSep")),
      rainMayAug: toOptNum(getVal(raw, colMap, "rainMayAug")),
    };

    const rowErrors = validateRequired(mapped, CORN_REQUIRED, rowNum);
    if (mapped.cornType && !CORN_TYPE_MAP[mapped.cornType]) {
      rowErrors.push({ row: rowNum, field: "cornType", message: `Unknown corn type: "${mapped.cornType}"`, value: mapped.cornType });
    }
    if (mapped.year && (mapped.year < 1990 || mapped.year > 2100)) {
      rowErrors.push({ row: rowNum, field: "year", message: "Year out of range", value: mapped.year });
    }

    rowErrors.length > 0 ? errors.push(...rowErrors) : rows.push(mapped);
  }

  return { fileType, valid: rows, errors, totalRows: rawData.length - 2 };
}

// =============================================================================
// Edibles Parser
// =============================================================================

function parseEdibleRows(rawData: unknown[][], headers: string[], fileType: ImportFileType): ParseResult {
  const colMap = buildColMap(headers, EDIBLE_COLUMN_MAP);
  const rows: EdibleLoadImportRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 2; i < rawData.length; i++) {
    const raw = rawData[i] as unknown[];
    if (!raw || isEmptyRow(raw)) continue;
    const rowNum = i + 1;

    const mapped: EdibleLoadImportRow = {
      year: toInt(getVal(raw, colMap, "year")) ?? 0,
      plantingDate: toDateStr(getVal(raw, colMap, "plantingDate")),
      nominalPlantDate: toDateStr(getVal(raw, colMap, "nominalPlantDate")),
      harvestDate: toDateStr(getVal(raw, colMap, "harvestDate")),
      nominalHarvestDate: toDateStr(getVal(raw, colMap, "nominalHarvestDate")),
      fieldName: toStr(getVal(raw, colMap, "fieldName")),
      acres: toNum(getVal(raw, colMap, "acres")) ?? 0,
      variety: toOptStr(getVal(raw, colMap, "variety")),
      patternTile: toOptInt(getVal(raw, colMap, "patternTile")),
      refNumber: toOptInt(getVal(raw, colMap, "refNumber")),
      beanType: toStr(getVal(raw, colMap, "beanType")),
      moisture: toOptNum(getVal(raw, colMap, "moisture")),
      moistDock: toOptNum(getVal(raw, colMap, "moistDock")),
      avgMoisture: toOptNum(getVal(raw, colMap, "avgMoisture")),
      moistDollarDocked: toOptNum(getVal(raw, colMap, "moistDollarDocked")),
      moistPerAcDocked: toOptNum(getVal(raw, colMap, "moistPerAcDocked")),
      damage: toOptNum(getVal(raw, colMap, "damage")),
      damageDock: toOptNum(getVal(raw, colMap, "damageDock")),
      avgDamage: toOptNum(getVal(raw, colMap, "avgDamage")),
      damageDollarDocked: toOptNum(getVal(raw, colMap, "damageDollarDocked")),
      damagePerAcDocked: toOptNum(getVal(raw, colMap, "damagePerAcDocked")),
      fm: toOptNum(getVal(raw, colMap, "fm")),
      fmDock: toOptNum(getVal(raw, colMap, "fmDock")),
      avgFm: toOptNum(getVal(raw, colMap, "avgFm")),
      fmDollarDocked: toOptNum(getVal(raw, colMap, "fmDollarDocked")),
      fmPerAcDocked: toOptNum(getVal(raw, colMap, "fmPerAcDocked")),
      skinCheck: toOptNum(getVal(raw, colMap, "skinCheck")),
      checksDock: toOptNum(getVal(raw, colMap, "checksDock")),
      avgSkinCheck: toOptNum(getVal(raw, colMap, "avgSkinCheck")),
      skinCheckDollarDocked: toOptNum(getVal(raw, colMap, "skinCheckDollarDocked")),
      skinCheckPerAc: toOptNum(getVal(raw, colMap, "skinCheckPerAc")),
      sproutsSplits: toOptNum(getVal(raw, colMap, "sproutsSplits")),
      splitsDock: toOptNum(getVal(raw, colMap, "splitsDock")),
      avgSproutsSplits: toOptNum(getVal(raw, colMap, "avgSproutsSplits")),
      sproutsDollarDocked: toOptNum(getVal(raw, colMap, "sproutsDollarDocked")),
      sproutsPerAcDocked: toOptNum(getVal(raw, colMap, "sproutsPerAcDocked")),
      grossUnits: toOptNum(getVal(raw, colMap, "grossUnits")),
      dockedUnits: toOptNum(getVal(raw, colMap, "dockedUnits")),
      shrink: toOptNum(getVal(raw, colMap, "shrink")),
      dockPlusShrink: toOptNum(getVal(raw, colMap, "dockPlusShrink")),
      netUnits: toOptNum(getVal(raw, colMap, "netUnits")),
      yield: toOptNum(getVal(raw, colMap, "yield")),
      totalDollarDocked: toOptNum(getVal(raw, colMap, "totalDollarDocked")),
      perAcDocked: toOptNum(getVal(raw, colMap, "perAcDocked")),
      finalPrice: toOptNum(getVal(raw, colMap, "finalPrice")),
      rainAprSep: toOptNum(getVal(raw, colMap, "rainAprSep")),
      rainMayAug: toOptNum(getVal(raw, colMap, "rainMayAug")),
    };

    const rowErrors = validateRequired(mapped, EDIBLE_REQUIRED, rowNum);
    if (mapped.beanType && !BEAN_TYPE_MAP[mapped.beanType]) {
      rowErrors.push({ row: rowNum, field: "beanType", message: `Unknown bean type: "${mapped.beanType}"`, value: mapped.beanType });
    }

    rowErrors.length > 0 ? errors.push(...rowErrors) : rows.push(mapped);
  }

  return { fileType, valid: rows, errors, totalRows: rawData.length - 2 };
}

// =============================================================================
// Field P&L Parser
// =============================================================================

function parsePLRows(rawData: unknown[][], headers: string[], fileType: ImportFileType): ParseResult {
  const colMap = buildColMap(headers, PL_COLUMN_MAP);
  const rows: FieldPLImportRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 2; i < rawData.length; i++) {
    const raw = rawData[i] as unknown[];
    if (!raw || isEmptyRow(raw)) continue;
    const rowNum = i + 1;

    const mapped: FieldPLImportRow = {
      year: toInt(getVal(raw, colMap, "year")) ?? 0,
      fieldName: toStr(getVal(raw, colMap, "fieldName")),
      fieldNumber: toInt(getVal(raw, colMap, "fieldNumber")) ?? 0,
      areaCode: toOptInt(getVal(raw, colMap, "areaCode")),
      acres: toNum(getVal(raw, colMap, "acres")) ?? 0,
      crop: toStr(getVal(raw, colMap, "crop")),
      yield: toOptNum(getVal(raw, colMap, "yield")),
      totalProduction: toOptNum(getVal(raw, colMap, "totalProduction")),
      pricePerUnit: toOptNum(getVal(raw, colMap, "pricePerUnit")),
      cropSale: toOptNum(getVal(raw, colMap, "cropSale")),
      govPayments: toOptNum(getVal(raw, colMap, "govPayments")),
      miscIncome: toOptNum(getVal(raw, colMap, "miscIncome")),
      hedging: toOptNum(getVal(raw, colMap, "hedging")),
      interestPatronage: toOptNum(getVal(raw, colMap, "interestPatronage")),
      insuranceIncome: toOptNum(getVal(raw, colMap, "insuranceIncome")),
      totalIncPerAcre: toOptNum(getVal(raw, colMap, "totalIncPerAcre")),
      machineLaborCost: toOptNum(getVal(raw, colMap, "machineLaborCost")),
      chemicalsCost: toOptNum(getVal(raw, colMap, "chemicalsCost")),
      seedCost: toOptNum(getVal(raw, colMap, "seedCost")),
      fertilizerCost: toOptNum(getVal(raw, colMap, "fertilizerCost")),
      rentCost: toOptNum(getVal(raw, colMap, "rentCost")),
      landImprovCost: toOptNum(getVal(raw, colMap, "landImprovCost")),
      insuranceExpense: toOptNum(getVal(raw, colMap, "insuranceExpense")),
      miscExpense: toOptNum(getVal(raw, colMap, "miscExpense")),
      totalCostPerAcre: toOptNum(getVal(raw, colMap, "totalCostPerAcre")),
      profitPerAcreByCrop: toOptNum(getVal(raw, colMap, "profitPerAcreByCrop")),
      totalNetByCrop: toOptNum(getVal(raw, colMap, "totalNetByCrop")),
      profitPerAcreByField: toOptNum(getVal(raw, colMap, "profitPerAcreByField")),
      roi: toOptNum(getVal(raw, colMap, "roi")),
      breakevenUnitsPerAcre: toOptNum(getVal(raw, colMap, "breakevenUnitsPerAcre")),
      breakevenPricePerUnit: toOptNum(getVal(raw, colMap, "breakevenPricePerUnit")),
      rentAvgAdjust: toOptNum(getVal(raw, colMap, "rentAvgAdjust")),
      goingRent: toOptNum(getVal(raw, colMap, "goingRent")),
      adjProfitPerAcre: toOptNum(getVal(raw, colMap, "adjProfitPerAcre")),
      adjTotalNet: toOptNum(getVal(raw, colMap, "adjTotalNet")),
      adjProfitByField: toOptNum(getVal(raw, colMap, "adjProfitByField")),
      dataQuality: toOptStr(getVal(raw, colMap, "dataQuality")),
      comments: toOptStr(getVal(raw, colMap, "comments")),
      status: toOptStr(getVal(raw, colMap, "status")),
    };

    const rowErrors = validateRequired(mapped, PL_REQUIRED, rowNum);
    rowErrors.length > 0 ? errors.push(...rowErrors) : rows.push(mapped);
  }

  return { fileType, valid: rows, errors, totalRows: rawData.length - 2 };
}

// =============================================================================
// Persistence — Corn
// =============================================================================

export async function persistCornData(
  rows: CornLoadImportRow[], userId: string, fileName: string
): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  let rowsProcessed = 0;

  const importLogId = await prisma.$transaction(async (tx) => {
    // Collect uniques
    const uniqueFields = new Map<number, { name: string; acres: number; patternTile: number | null }>();
    const uniqueCompanies = new Set<string>();
    const uniqueVarieties = new Map<string, string>();
    const rainfallByYear = new Map<number, { apr: number | null; may: number | null }>();

    for (const row of rows) {
      uniqueFields.set(row.fieldNumber, { name: row.fieldName, acres: row.acres, patternTile: row.patternTile });
      uniqueCompanies.add(row.seedCompany);
      if (row.variety) uniqueVarieties.set(`${row.seedCompany}|${row.variety}`, row.seedCompany);
      if (!rainfallByYear.has(row.year) && (row.rainAprSep !== null || row.rainMayAug !== null)) {
        rainfallByYear.set(row.year, { apr: row.rainAprSep, may: row.rainMayAug });
      }
    }

    // Upsert fields
    const fieldMap = new Map<number, string>();
    for (const [num, data] of uniqueFields) {
      const f = await tx.field.upsert({
        where: { fieldNumber: num },
        create: { fieldNumber: num, name: data.name, acres: data.acres, patternTile: data.patternTile },
        update: { acres: data.acres, patternTile: data.patternTile },
      });
      fieldMap.set(num, f.id);
    }

    // Upsert seed companies
    const companyMap = new Map<string, string>();
    for (const name of uniqueCompanies) {
      const c = await tx.seedCompany.upsert({ where: { name }, create: { name }, update: {} });
      companyMap.set(name, c.id);
    }

    // Upsert varieties
    const varietyMap = new Map<string, string>();
    for (const [key, company] of uniqueVarieties) {
      const [, varName] = key.split("|");
      const compId = companyMap.get(company);
      if (!compId || !varName) continue;
      const v = await tx.variety.upsert({
        where: { seedCompanyId_name_cropCategory: { seedCompanyId: compId, name: varName, cropCategory: "CORN" } },
        create: { name: varName, seedCompanyId: compId, cropCategory: "CORN" },
        update: {},
      });
      varietyMap.set(key, v.id);
    }

    // Bulk create loads in batches
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const data: Prisma.CornLoadCreateManyInput[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const fieldId = fieldMap.get(row.fieldNumber);
        const cornEnum = CORN_TYPE_MAP[row.cornType] as CornType | undefined;
        if (!fieldId || !cornEnum) {
          errors.push({ row: i + j + 3, field: "fieldNumber/cornType", message: "Missing field or invalid corn type" });
          continue;
        }
        const vKey = row.variety ? `${row.seedCompany}|${row.variety}` : null;
        data.push({
          year: row.year, fieldId, varietyId: vKey ? varietyMap.get(vKey) ?? null : null,
          cornType: cornEnum,
          nominalPlantDate: toDate(row.nominalPlantDate), nominalHarvestDate: toDate(row.nominalHarvestDate),
          plantingDate: toDate(row.plantingDate), harvestDate: toDate(row.harvestDate),
          deliveredTo: row.deliveredTo,
          testWeight: row.testWeight, moisture: row.moisture,
          grossWeight: row.grossWeight, tareWeight: row.tareWeight, netWeight: row.netWeight,
          wetBushel: row.wetBushel, dryBushel: row.dryBushel, commonDryBushel: row.commonDryBushel,
          shrink: row.shrink, dmTons: row.dmTons, origTpa: row.origTpa, adjTpa: row.adjTpa,
          wetYield: row.wetYield, dryYield: row.dryYield, commonDryYield: row.commonDryYield,
          finalPrice: row.finalPrice,
        });
      }
      if (data.length > 0) {
        const result = await tx.cornLoad.createMany({ data });
        rowsProcessed += result.count;
      }
    }

    // Upsert season rainfall
    for (const [year, rain] of rainfallByYear) {
      await tx.seasonData.upsert({
        where: { year },
        create: { year, rainAprSep: rain.apr, rainMayAug: rain.may },
        update: { rainAprSep: rain.apr, rainMayAug: rain.may },
      });
    }

    return (await tx.importLog.create({
      data: { userId, fileName, fileType: "corn", rowsProcessed, rowsFailed: errors.length,
        status: errors.length === 0 ? "success" : rowsProcessed > 0 ? "partial" : "failed",
        errors: errors.length > 0 ? (errors as unknown as Prisma.JsonArray) : Prisma.JsonNull },
    })).id;
  }, { timeout: 120000 });

  return { rowsProcessed, rowsFailed: errors.length, errors, importLogId, fileType: "corn" };
}

// =============================================================================
// Persistence — Edibles
// =============================================================================

export async function persistEdibleData(
  rows: EdibleLoadImportRow[], userId: string, fileName: string
): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  let rowsProcessed = 0;

  const importLogId = await prisma.$transaction(async (tx) => {
    // Upsert fields (by name since edibles has no field #)
    const fieldMap = new Map<string, string>();
    const uniqueFields = new Map<string, { acres: number; patternTile: number | null }>();
    for (const row of rows) {
      uniqueFields.set(row.fieldName, { acres: row.acres, patternTile: row.patternTile });
    }
    for (const [name, data] of uniqueFields) {
      const f = await tx.field.upsert({
        where: { name },
        create: { name, acres: data.acres, patternTile: data.patternTile },
        update: { acres: data.acres, patternTile: data.patternTile ?? undefined },
      });
      fieldMap.set(name, f.id);
    }

    // Upsert varieties (no seed company for beans)
    const varietyMap = new Map<string, string>();
    const uniqueVarieties = new Set(rows.filter((r) => r.variety && r.variety !== "N/A").map((r) => r.variety!));
    for (const vName of uniqueVarieties) {
      const v = await tx.variety.upsert({
        where: { seedCompanyId_name_cropCategory: { seedCompanyId: null as unknown as string, name: vName, cropCategory: "EDIBLE_BEAN" } },
        // The unique constraint may fail with null seedCompanyId — use findFirst + create pattern
        create: { name: vName, cropCategory: "EDIBLE_BEAN" },
        update: {},
      }).catch(async () => {
        // Fallback: try to find or create
        const existing = await tx.variety.findFirst({ where: { name: vName, cropCategory: "EDIBLE_BEAN", seedCompanyId: null } });
        if (existing) return existing;
        return tx.variety.create({ data: { name: vName, cropCategory: "EDIBLE_BEAN" } });
      });
      varietyMap.set(vName, v.id);
    }

    // Bulk create loads
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const data: Prisma.EdibleLoadCreateManyInput[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const fieldId = fieldMap.get(row.fieldName);
        const beanEnum = BEAN_TYPE_MAP[row.beanType] as BeanType | undefined;
        if (!fieldId || !beanEnum) {
          errors.push({ row: i + j + 3, field: "field/beanType", message: "Missing field or invalid bean type" });
          continue;
        }
        const varietyId = row.variety && row.variety !== "N/A" ? varietyMap.get(row.variety) ?? null : null;

        data.push({
          year: row.year, fieldId, varietyId, beanType: beanEnum,
          plantingDate: toDate(row.plantingDate), nominalPlantDate: toDate(row.nominalPlantDate),
          harvestDate: toDate(row.harvestDate), nominalHarvestDate: toDate(row.nominalHarvestDate),
          refNumber: row.refNumber,
          moisture: row.moisture, moistDock: row.moistDock, avgMoisture: row.avgMoisture,
          moistDollarDocked: row.moistDollarDocked, moistPerAcDocked: row.moistPerAcDocked,
          damage: row.damage, damageDock: row.damageDock, avgDamage: row.avgDamage,
          damageDollarDocked: row.damageDollarDocked, damagePerAcDocked: row.damagePerAcDocked,
          fm: row.fm, fmDock: row.fmDock, avgFm: row.avgFm,
          fmDollarDocked: row.fmDollarDocked, fmPerAcDocked: row.fmPerAcDocked,
          skinCheck: row.skinCheck, checksDock: row.checksDock, avgSkinCheck: row.avgSkinCheck,
          skinCheckDollarDocked: row.skinCheckDollarDocked, skinCheckPerAc: row.skinCheckPerAc,
          sproutsSplits: row.sproutsSplits, splitsDock: row.splitsDock, avgSproutsSplits: row.avgSproutsSplits,
          sproutsDollarDocked: row.sproutsDollarDocked, sproutsPerAcDocked: row.sproutsPerAcDocked,
          grossUnits: row.grossUnits, dockedUnits: row.dockedUnits, shrink: row.shrink,
          dockPlusShrink: row.dockPlusShrink, netUnits: row.netUnits,
          yield: row.yield, totalDollarDocked: row.totalDollarDocked, perAcDocked: row.perAcDocked,
          finalPrice: row.finalPrice,
        });
      }
      if (data.length > 0) {
        const result = await tx.edibleLoad.createMany({ data });
        rowsProcessed += result.count;
      }
    }

    // Rainfall
    const rainfallByYear = new Map<number, { apr: number | null; may: number | null }>();
    for (const row of rows) {
      if (!rainfallByYear.has(row.year) && (row.rainAprSep !== null || row.rainMayAug !== null)) {
        rainfallByYear.set(row.year, { apr: row.rainAprSep, may: row.rainMayAug });
      }
    }
    for (const [year, rain] of rainfallByYear) {
      await tx.seasonData.upsert({
        where: { year },
        create: { year, rainAprSep: rain.apr, rainMayAug: rain.may },
        update: { rainAprSep: rain.apr ?? undefined, rainMayAug: rain.may ?? undefined },
      });
    }

    return (await tx.importLog.create({
      data: { userId, fileName, fileType: "edibles", rowsProcessed, rowsFailed: errors.length,
        status: errors.length === 0 ? "success" : rowsProcessed > 0 ? "partial" : "failed",
        errors: errors.length > 0 ? (errors as unknown as Prisma.JsonArray) : Prisma.JsonNull },
    })).id;
  }, { timeout: 120000 });

  return { rowsProcessed, rowsFailed: errors.length, errors, importLogId, fileType: "edibles" };
}

// =============================================================================
// Persistence — Field P&L
// =============================================================================

export async function persistPLData(
  rows: FieldPLImportRow[], userId: string, fileName: string
): Promise<ImportResult> {
  const errors: ValidationError[] = [];
  let rowsProcessed = 0;

  const importLogId = await prisma.$transaction(async (tx) => {
    // Upsert fields
    const fieldMap = new Map<number, string>();
    for (const row of rows) {
      if (!fieldMap.has(row.fieldNumber)) {
        const f = await tx.field.upsert({
          where: { fieldNumber: row.fieldNumber },
          create: { fieldNumber: row.fieldNumber, name: row.fieldName, acres: row.acres, areaCode: row.areaCode },
          update: { name: row.fieldName, acres: row.acres, areaCode: row.areaCode ?? undefined },
        });
        fieldMap.set(row.fieldNumber, f.id);
      }
    }

    // Upsert crops
    const cropMap = new Map<string, string>();
    const uniqueCrops = new Set(rows.map((r) => r.crop));
    for (const cropName of uniqueCrops) {
      const category = (CROP_CATEGORY_MAP[cropName] ?? "SPECIALTY") as CropCategory;
      const c = await tx.crop.upsert({
        where: { name: cropName },
        create: { name: cropName, category },
        update: { category },
      });
      cropMap.set(cropName, c.id);
    }

    // Upsert FieldCropYear records
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fieldId = fieldMap.get(row.fieldNumber);
      const cropId = cropMap.get(row.crop);
      if (!fieldId || !cropId) {
        errors.push({ row: i + 3, field: "field/crop", message: "Missing field or crop reference" });
        continue;
      }

      try {
        await tx.fieldCropYear.upsert({
          where: { fieldId_cropId_year: { fieldId, cropId, year: row.year } },
          create: {
            year: row.year, fieldId, cropId, acres: row.acres,
            yield: row.yield, totalProduction: row.totalProduction,
            pricePerUnit: row.pricePerUnit, cropSale: row.cropSale,
            govPayments: row.govPayments, miscIncome: row.miscIncome,
            hedging: row.hedging, interestPatronage: row.interestPatronage,
            insuranceIncome: row.insuranceIncome, totalIncPerAcre: row.totalIncPerAcre,
            machineLaborCost: row.machineLaborCost, chemicalsCost: row.chemicalsCost,
            seedCost: row.seedCost, fertilizerCost: row.fertilizerCost,
            rentCost: row.rentCost, landImprovCost: row.landImprovCost,
            insuranceExpense: row.insuranceExpense, miscExpense: row.miscExpense,
            totalCostPerAcre: row.totalCostPerAcre,
            profitPerAcreByCrop: row.profitPerAcreByCrop, totalNetByCrop: row.totalNetByCrop,
            profitPerAcreByField: row.profitPerAcreByField, roi: row.roi,
            breakevenUnitsPerAcre: row.breakevenUnitsPerAcre, breakevenPricePerUnit: row.breakevenPricePerUnit,
            rentAvgAdjust: row.rentAvgAdjust, goingRent: row.goingRent,
            adjProfitPerAcre: row.adjProfitPerAcre, adjTotalNet: row.adjTotalNet,
            adjProfitByField: row.adjProfitByField,
            dataQuality: row.dataQuality, comments: row.comments, status: row.status,
          },
          update: {
            acres: row.acres, yield: row.yield, totalProduction: row.totalProduction,
            pricePerUnit: row.pricePerUnit, cropSale: row.cropSale,
            govPayments: row.govPayments, miscIncome: row.miscIncome,
            hedging: row.hedging, interestPatronage: row.interestPatronage,
            insuranceIncome: row.insuranceIncome, totalIncPerAcre: row.totalIncPerAcre,
            machineLaborCost: row.machineLaborCost, chemicalsCost: row.chemicalsCost,
            seedCost: row.seedCost, fertilizerCost: row.fertilizerCost,
            rentCost: row.rentCost, landImprovCost: row.landImprovCost,
            insuranceExpense: row.insuranceExpense, miscExpense: row.miscExpense,
            totalCostPerAcre: row.totalCostPerAcre,
            profitPerAcreByCrop: row.profitPerAcreByCrop, totalNetByCrop: row.totalNetByCrop,
            profitPerAcreByField: row.profitPerAcreByField, roi: row.roi,
            breakevenUnitsPerAcre: row.breakevenUnitsPerAcre, breakevenPricePerUnit: row.breakevenPricePerUnit,
            rentAvgAdjust: row.rentAvgAdjust, goingRent: row.goingRent,
            adjProfitPerAcre: row.adjProfitPerAcre, adjTotalNet: row.adjTotalNet,
            adjProfitByField: row.adjProfitByField,
            dataQuality: row.dataQuality, comments: row.comments, status: row.status,
          },
        });
        rowsProcessed++;
      } catch (err) {
        errors.push({ row: i + 3, field: "", message: err instanceof Error ? err.message : "Persistence error" });
      }
    }

    return (await tx.importLog.create({
      data: { userId, fileName, fileType: "field_pl", rowsProcessed, rowsFailed: errors.length,
        status: errors.length === 0 ? "success" : rowsProcessed > 0 ? "partial" : "failed",
        errors: errors.length > 0 ? (errors as unknown as Prisma.JsonArray) : Prisma.JsonNull },
    })).id;
  }, { timeout: 120000 });

  return { rowsProcessed, rowsFailed: errors.length, errors, importLogId, fileType: "field_pl" };
}

// =============================================================================
// Helpers
// =============================================================================

type ColMap = Map<string, number>;

function buildColMap(headers: string[], columnMap: Record<string, string>): ColMap {
  const map = new Map<string, number>();
  for (let i = 0; i < headers.length; i++) {
    const field = columnMap[headers[i]];
    if (field) map.set(field, i);
  }
  return map;
}

function getVal(raw: unknown[], colMap: ColMap, field: string): unknown {
  const idx = colMap.get(field);
  return idx !== undefined ? raw[idx] : undefined;
}

function validateRequired<T extends object>(row: T, required: (keyof T)[], rowNum: number): ValidationError[] {
  const errs: ValidationError[] = [];
  for (const field of required) {
    const v = row[field];
    if (v === null || v === undefined || v === "" || v === 0) {
      if (typeof field === "string" && ["year", "fieldNumber", "acres"].includes(field) && v === 0) {
        errs.push({ row: rowNum, field: field as string, message: `${field as string} is required and must be non-zero` });
      } else if (!v && v !== 0) {
        errs.push({ row: rowNum, field: field as string, message: `${field as string} is required` });
      }
    }
  }
  return errs;
}

function isEmptyRow(raw: unknown[]): boolean {
  return raw.every((v) => v === null || v === undefined || v === "");
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function toOptNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s.toUpperCase() === "N/A" || s === "#N/A") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function toInt(v: unknown): number | null {
  const n = toNum(v);
  return n !== null ? Math.round(n) : null;
}
function toOptInt(v: unknown): number | null {
  const n = toOptNum(v);
  return n !== null ? Math.round(n) : null;
}
function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function toOptStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s.toUpperCase() === "N/A" ? null : s;
}
function toDateStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  if (s === "" || s.toUpperCase() === "N/A") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function toDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
