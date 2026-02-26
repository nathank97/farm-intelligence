import { prisma } from '@/lib/prisma/client';
import { decimalToNumber } from '@/utils/formatters';
import type { DashboardFilters } from '@/types/api';
import type { FinancialSummaryData, CostBreakdown } from '@/types/dashboard';

export async function getFinancialSummary(
  filters: DashboardFilters
): Promise<FinancialSummaryData[]> {
  const where: Record<string, unknown> = {};
  if (filters.year) where.year = filters.year;
  if (filters.cropId) where.cropId = filters.cropId;
  if (filters.fieldId) where.fieldId = filters.fieldId;

  const records = await prisma.fieldCropYear.findMany({
    where: { ...where, financials: { isNot: null } },
    include: {
      field: true,
      crop: true,
      financials: true,
    },
    orderBy: [{ year: 'desc' }, { field: { name: 'asc' } }],
  });

  return records.map((r) => ({
    fieldName: r.field.name,
    cropName: r.crop.name,
    year: r.year,
    totalCost: decimalToNumber(r.financials?.totalCost),
    totalRevenue: decimalToNumber(r.financials?.totalRevenue),
    grossMargin: decimalToNumber(r.financials?.grossMargin),
    costPerAcre: decimalToNumber(r.financials?.costPerAcre),
    revenuePerAcre: decimalToNumber(r.financials?.revenuePerAcre),
  }));
}

export async function getCostBreakdown(
  filters: DashboardFilters
): Promise<CostBreakdown[]> {
  const where: Record<string, unknown> = {};
  if (filters.year) {
    where.fieldCropYear = { year: filters.year };
  }
  if (filters.cropId) {
    where.fieldCropYear = { ...where.fieldCropYear as object, cropId: filters.cropId };
  }
  if (filters.fieldId) {
    where.fieldCropYear = { ...where.fieldCropYear as object, fieldId: filters.fieldId };
  }

  const agg = await prisma.financial.aggregate({
    where,
    _sum: {
      seedCost: true,
      fertilizerCost: true,
      sprayCost: true,
      operationsCost: true,
    },
  });

  return [
    { category: 'Seed', amount: decimalToNumber(agg._sum.seedCost) ?? 0 },
    { category: 'Fertilizer', amount: decimalToNumber(agg._sum.fertilizerCost) ?? 0 },
    { category: 'Spray', amount: decimalToNumber(agg._sum.sprayCost) ?? 0 },
    { category: 'Operations', amount: decimalToNumber(agg._sum.operationsCost) ?? 0 },
  ];
}

export async function getFinancialStats(filters: DashboardFilters) {
  const where: Record<string, unknown> = {};
  if (filters.year) {
    where.fieldCropYear = { year: filters.year };
  }

  const agg = await prisma.financial.aggregate({
    where,
    _sum: { totalRevenue: true, totalCost: true, grossMargin: true },
    _avg: { costPerAcre: true, revenuePerAcre: true, grossMargin: true },
  });

  return {
    totalRevenue: decimalToNumber(agg._sum.totalRevenue) ?? 0,
    totalCost: decimalToNumber(agg._sum.totalCost) ?? 0,
    totalGrossMargin: decimalToNumber(agg._sum.grossMargin) ?? 0,
    avgCostPerAcre: decimalToNumber(agg._avg.costPerAcre) ?? 0,
    avgRevenuePerAcre: decimalToNumber(agg._avg.revenuePerAcre) ?? 0,
    avgGrossMargin: decimalToNumber(agg._avg.grossMargin) ?? 0,
  };
}
