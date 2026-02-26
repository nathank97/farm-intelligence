import { prisma } from '@/lib/prisma/client';
import { decimalToNumber } from '@/utils/formatters';
import type { DashboardFilters } from '@/types/api';
import type {
  CropPerformanceData,
  YieldTrendPoint,
  StatsOverview,
  FilterOption,
} from '@/types/dashboard';

export async function getCropPerformance(
  filters: DashboardFilters
): Promise<CropPerformanceData[]> {
  const where: Record<string, unknown> = {};
  if (filters.year) where.year = filters.year;
  if (filters.cropId) where.cropId = filters.cropId;
  if (filters.fieldId) where.fieldId = filters.fieldId;

  const records = await prisma.fieldCropYear.findMany({
    where,
    include: {
      field: true,
      crop: true,
      variety: true,
    },
    orderBy: [{ year: 'desc' }, { field: { name: 'asc' } }],
  });

  return records.map((r) => ({
    fieldName: r.field.name,
    cropName: r.crop.name,
    varietyName: r.variety?.name ?? null,
    year: r.year,
    acreage: decimalToNumber(r.field.acreage) ?? 0,
    yieldPerAcre: decimalToNumber(r.yieldPerAcre),
    totalYield: decimalToNumber(r.totalYield),
  }));
}

export async function getYieldTrends(
  filters: DashboardFilters
): Promise<YieldTrendPoint[]> {
  const where: Record<string, unknown> = { yieldPerAcre: { not: null } };
  if (filters.cropId) where.cropId = filters.cropId;
  if (filters.fieldId) where.fieldId = filters.fieldId;

  const records = await prisma.fieldCropYear.findMany({
    where,
    include: { crop: true },
    orderBy: { year: 'asc' },
  });

  // Group by year + crop, compute average
  const grouped = new Map<string, { sum: number; count: number; cropName: string; year: number }>();
  for (const r of records) {
    const key = `${r.year}-${r.crop.name}`;
    const existing = grouped.get(key);
    const ypa = decimalToNumber(r.yieldPerAcre) ?? 0;
    if (existing) {
      existing.sum += ypa;
      existing.count += 1;
    } else {
      grouped.set(key, { sum: ypa, count: 1, cropName: r.crop.name, year: r.year });
    }
  }

  return Array.from(grouped.values()).map((g) => ({
    year: g.year,
    cropName: g.cropName,
    avgYieldPerAcre: g.sum / g.count,
  }));
}

export async function getStatsOverview(): Promise<StatsOverview> {
  const [fieldCount, cropCount, fields, latestRecord, avgYield, avgMargin] =
    await Promise.all([
      prisma.field.count({ where: { isActive: true } }),
      prisma.crop.count(),
      prisma.field.findMany({ where: { isActive: true }, select: { acreage: true } }),
      prisma.fieldCropYear.findFirst({ orderBy: { year: 'desc' }, select: { year: true } }),
      prisma.fieldCropYear.aggregate({ _avg: { yieldPerAcre: true } }),
      prisma.financial.aggregate({ _avg: { grossMargin: true } }),
    ]);

  const totalAcreage = fields.reduce(
    (sum, f) => sum + (decimalToNumber(f.acreage) ?? 0),
    0
  );

  return {
    totalFields: fieldCount,
    totalCrops: cropCount,
    totalAcreage,
    avgYieldPerAcre: decimalToNumber(avgYield._avg.yieldPerAcre),
    avgGrossMargin: decimalToNumber(avgMargin._avg.grossMargin),
    latestYear: latestRecord?.year ?? null,
  };
}

export async function getAvailableYears(): Promise<FilterOption[]> {
  const records = await prisma.fieldCropYear.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  });
  return records.map((r) => ({ value: String(r.year), label: String(r.year) }));
}

export async function getAvailableCrops(): Promise<FilterOption[]> {
  const crops = await prisma.crop.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return crops.map((c) => ({ value: c.id, label: c.name }));
}

export async function getAvailableFields(): Promise<FilterOption[]> {
  const fields = await prisma.field.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return fields.map((f) => ({ value: f.id, label: f.name }));
}
