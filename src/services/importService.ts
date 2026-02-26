import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma/client';
import type { ImportRow, ValidationError, ParseResult, ImportSummary } from '@/types/import';

const EXPECTED_HEADERS = [
  'Field Name',
  'Crop Name',
  'Year',
] as const;

const OPTIONAL_HEADERS = [
  'Variety Name',
  'Acreage',
  'Soil Type',
  'Crop Category',
  'Yield Per Acre',
  'Total Yield',
  'Planting Date',
  'Harvest Date',
  'Seed Cost',
  'Fertilizer Cost',
  'Spray Cost',
  'Operations Cost',
  'Total Cost',
  'Revenue Per Tonne',
  'Total Revenue',
  'Gross Margin',
  'Cost Per Acre',
  'Revenue Per Acre',
  'Notes',
] as const;

export function getExpectedHeaders(): string[] {
  return [...EXPECTED_HEADERS, ...OPTIONAL_HEADERS];
}

function toHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const headerMap: Record<string, keyof ImportRow> = {
  fieldname: 'fieldName',
  cropname: 'cropName',
  varietyname: 'varietyName',
  year: 'year',
  acreage: 'acreage',
  soiltype: 'soilType',
  cropcategory: 'cropCategory',
  yieldperacre: 'yieldPerAcre',
  totalyield: 'totalYield',
  plantingdate: 'plantingDate',
  harvestdate: 'harvestDate',
  seedcost: 'seedCost',
  fertilizercost: 'fertilizerCost',
  spraycost: 'sprayCost',
  operationscost: 'operationsCost',
  totalcost: 'totalCost',
  revenuepertonne: 'revenuePerTonne',
  totalrevenue: 'totalRevenue',
  grossmargin: 'grossMargin',
  costperacre: 'costPerAcre',
  revenueperacre: 'revenuePerAcre',
  notes: 'notes',
};

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const valid: ImportRow[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // 1-indexed + header row
    const raw = rawRows[i];
    const row: Partial<ImportRow> = {};

    // Map headers
    for (const [key, value] of Object.entries(raw)) {
      const normalized = toHeaderKey(key);
      const mappedKey = headerMap[normalized];
      if (mappedKey) {
        (row as Record<string, unknown>)[mappedKey] = value;
      }
    }

    // Validate required fields
    if (!row.fieldName || typeof row.fieldName !== 'string') {
      errors.push({ row: rowNum, field: 'Field Name', message: 'Field Name is required' });
      continue;
    }
    if (!row.cropName || typeof row.cropName !== 'string') {
      errors.push({ row: rowNum, field: 'Crop Name', message: 'Crop Name is required' });
      continue;
    }
    if (!row.year || isNaN(Number(row.year))) {
      errors.push({ row: rowNum, field: 'Year', message: 'Year is required and must be a number' });
      continue;
    }

    // Coerce numeric fields
    const numericFields: (keyof ImportRow)[] = [
      'acreage', 'yieldPerAcre', 'totalYield', 'seedCost', 'fertilizerCost',
      'sprayCost', 'operationsCost', 'totalCost', 'revenuePerTonne',
      'totalRevenue', 'grossMargin', 'costPerAcre', 'revenuePerAcre',
    ];

    let hasError = false;
    for (const field of numericFields) {
      const val = row[field];
      if (val != null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push({ row: rowNum, field, message: `${field} must be a number` });
          hasError = true;
          break;
        }
        (row as Record<string, unknown>)[field] = num;
      }
    }
    if (hasError) continue;

    valid.push({
      fieldName: String(row.fieldName).trim(),
      cropName: String(row.cropName).trim(),
      varietyName: row.varietyName ? String(row.varietyName).trim() : undefined,
      year: Number(row.year),
      acreage: row.acreage as number | undefined,
      soilType: row.soilType ? String(row.soilType).trim() : undefined,
      cropCategory: row.cropCategory ? String(row.cropCategory).trim() : undefined,
      yieldPerAcre: row.yieldPerAcre as number | undefined,
      totalYield: row.totalYield as number | undefined,
      plantingDate: row.plantingDate ? String(row.plantingDate) : undefined,
      harvestDate: row.harvestDate ? String(row.harvestDate) : undefined,
      seedCost: row.seedCost as number | undefined,
      fertilizerCost: row.fertilizerCost as number | undefined,
      sprayCost: row.sprayCost as number | undefined,
      operationsCost: row.operationsCost as number | undefined,
      totalCost: row.totalCost as number | undefined,
      revenuePerTonne: row.revenuePerTonne as number | undefined,
      totalRevenue: row.totalRevenue as number | undefined,
      grossMargin: row.grossMargin as number | undefined,
      costPerAcre: row.costPerAcre as number | undefined,
      revenuePerAcre: row.revenuePerAcre as number | undefined,
      notes: row.notes ? String(row.notes) : undefined,
    });
  }

  return { valid, errors };
}

export async function persistData(
  rows: ImportRow[],
  userId: string,
  fileName: string
): Promise<ImportSummary> {
  const errors: ValidationError[] = [];
  let processed = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // Upsert Field
        const field = await tx.field.upsert({
          where: { name: row.fieldName },
          create: {
            name: row.fieldName,
            acreage: row.acreage ?? 0,
            soilType: row.soilType,
          },
          update: {
            ...(row.acreage != null && { acreage: row.acreage }),
            ...(row.soilType && { soilType: row.soilType }),
          },
        });

        // Upsert Crop
        const crop = await tx.crop.upsert({
          where: { name: row.cropName },
          create: { name: row.cropName, category: row.cropCategory },
          update: {
            ...(row.cropCategory && { category: row.cropCategory }),
          },
        });

        // Upsert Variety (if provided)
        let varietyId: string | undefined;
        if (row.varietyName) {
          const variety = await tx.variety.upsert({
            where: { cropId_name: { cropId: crop.id, name: row.varietyName } },
            create: { name: row.varietyName, cropId: crop.id },
            update: {},
          });
          varietyId = variety.id;
        }

        // Upsert FieldCropYear
        const fcy = await tx.fieldCropYear.upsert({
          where: {
            fieldId_cropId_year: {
              fieldId: field.id,
              cropId: crop.id,
              year: row.year,
            },
          },
          create: {
            fieldId: field.id,
            cropId: crop.id,
            varietyId: varietyId,
            year: row.year,
            yieldPerAcre: row.yieldPerAcre,
            totalYield: row.totalYield,
            plantingDate: row.plantingDate ? new Date(row.plantingDate) : undefined,
            harvestDate: row.harvestDate ? new Date(row.harvestDate) : undefined,
            notes: row.notes,
          },
          update: {
            ...(varietyId && { varietyId }),
            ...(row.yieldPerAcre != null && { yieldPerAcre: row.yieldPerAcre }),
            ...(row.totalYield != null && { totalYield: row.totalYield }),
            ...(row.plantingDate && { plantingDate: new Date(row.plantingDate) }),
            ...(row.harvestDate && { harvestDate: new Date(row.harvestDate) }),
            ...(row.notes && { notes: row.notes }),
          },
        });

        // Upsert Financial (if any cost/revenue data present)
        const hasFinancials = [
          row.seedCost, row.fertilizerCost, row.sprayCost, row.operationsCost,
          row.totalCost, row.revenuePerTonne, row.totalRevenue, row.grossMargin,
          row.costPerAcre, row.revenuePerAcre,
        ].some((v) => v != null);

        if (hasFinancials) {
          await tx.financial.upsert({
            where: { fieldCropYearId: fcy.id },
            create: {
              fieldCropYearId: fcy.id,
              seedCost: row.seedCost,
              fertilizerCost: row.fertilizerCost,
              sprayCost: row.sprayCost,
              operationsCost: row.operationsCost,
              totalCost: row.totalCost,
              revenuePerTonne: row.revenuePerTonne,
              totalRevenue: row.totalRevenue,
              grossMargin: row.grossMargin,
              costPerAcre: row.costPerAcre,
              revenuePerAcre: row.revenuePerAcre,
            },
            update: {
              ...(row.seedCost != null && { seedCost: row.seedCost }),
              ...(row.fertilizerCost != null && { fertilizerCost: row.fertilizerCost }),
              ...(row.sprayCost != null && { sprayCost: row.sprayCost }),
              ...(row.operationsCost != null && { operationsCost: row.operationsCost }),
              ...(row.totalCost != null && { totalCost: row.totalCost }),
              ...(row.revenuePerTonne != null && { revenuePerTonne: row.revenuePerTonne }),
              ...(row.totalRevenue != null && { totalRevenue: row.totalRevenue }),
              ...(row.grossMargin != null && { grossMargin: row.grossMargin }),
              ...(row.costPerAcre != null && { costPerAcre: row.costPerAcre }),
              ...(row.revenuePerAcre != null && { revenuePerAcre: row.revenuePerAcre }),
            },
          });
        }

        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ row: rowNum, field: 'general', message });
      }
    }

    // Log import
    const status = errors.length === 0 ? 'success' : processed > 0 ? 'partial' : 'failed';
    await tx.importLog.create({
      data: {
        userId,
        fileName,
        rowsProcessed: processed,
        rowsFailed: errors.length,
        status,
        errors: errors.length > 0 ? JSON.parse(JSON.stringify(errors)) : undefined,
      },
    });
  });

  const status = errors.length === 0 ? 'success' : processed > 0 ? 'partial' : 'failed';
  return {
    fileName,
    totalRows: rows.length,
    rowsProcessed: processed,
    rowsFailed: errors.length,
    status,
    errors,
  };
}
