/**
 * Financial Service — Queries FieldCropYear table only
 */

import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import type { DashboardFilters } from "@/types/api";
import type {
  FieldPLSummary,
  CropProfitability,
  ExpenseBreakdown,
  RevenueBreakdown,
  YearOverYearFinancial,
  FilterOption,
} from "@/types/dashboard";

function d(v: Prisma.Decimal | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function buildWhere(filters: DashboardFilters): Prisma.FieldCropYearWhereInput {
  const where: Prisma.FieldCropYearWhereInput = {};
  if (filters.year) where.year = filters.year;
  if (filters.fieldId) where.fieldId = filters.fieldId;
  if (filters.cropCategory) where.crop = { category: filters.cropCategory as Prisma.EnumCropCategoryFilter };
  if (filters.crop) where.crop = { ...(where.crop as object), name: filters.crop };
  return where;
}

export async function getFieldPLSummaries(
  filters: DashboardFilters
): Promise<FieldPLSummary[]> {
  const where = buildWhere(filters);

  const rows = await prisma.fieldCropYear.findMany({
    where,
    include: { field: true, crop: true },
    orderBy: [{ year: "desc" }, { field: { name: "asc" } }],
  });

  return rows.map((r) => ({
    fieldName: r.field.name,
    fieldNumber: r.field.fieldNumber ?? 0,
    year: r.year,
    acres: Number(r.acres),
    crop: r.crop.name,
    cropCategory: r.crop.category,
    yield: d(r.yield),
    totalIncPerAcre: d(r.totalIncPerAcre),
    totalCostPerAcre: d(r.totalCostPerAcre),
    profitPerAcreByCrop: d(r.profitPerAcreByCrop),
    totalNetByCrop: d(r.totalNetByCrop),
    roi: d(r.roi),
    dataQuality: r.dataQuality,
  }));
}

export async function getCropProfitability(
  filters: DashboardFilters
): Promise<CropProfitability[]> {
  const where = buildWhere(filters);

  const rows = await prisma.fieldCropYear.findMany({
    where,
    select: {
      year: true,
      fieldId: true,
      acres: true,
      yield: true,
      totalIncPerAcre: true,
      totalCostPerAcre: true,
      profitPerAcreByCrop: true,
      roi: true,
      crop: { select: { name: true, category: true } },
    },
  });

  // Group by crop name
  const byCrop = new Map<string, typeof rows>();
  for (const row of rows) {
    const arr = byCrop.get(row.crop.name) ?? [];
    arr.push(row);
    byCrop.set(row.crop.name, arr);
  }

  return Array.from(byCrop.entries())
    .map(([cropName, group]) => {
      const first = group[0];
      const yields = group.map((r) => d(r.yield)).filter((v): v is number => v !== null);
      const incomes = group.map((r) => d(r.totalIncPerAcre)).filter((v): v is number => v !== null);
      const costs = group.map((r) => d(r.totalCostPerAcre)).filter((v): v is number => v !== null);
      const profits = group.map((r) => d(r.profitPerAcreByCrop)).filter((v): v is number => v !== null);
      const rois = group.map((r) => d(r.roi)).filter((v): v is number => v !== null);
      const uniqueYears = new Set(group.map((r) => r.year));
      const uniqueFields = new Set(group.map((r) => r.fieldId));

      return {
        crop: cropName,
        cropCategory: first.crop.category,
        yearCount: uniqueYears.size,
        fieldCount: uniqueFields.size,
        avgYield: yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0,
        avgIncomePerAcre: incomes.length > 0 ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0,
        avgCostPerAcre: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
        avgProfitPerAcre: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
        avgRoi: rois.length > 0 ? rois.reduce((a, b) => a + b, 0) / rois.length : 0,
        totalAcres: group.reduce((sum, r) => sum + Number(r.acres), 0),
      };
    })
    .sort((a, b) => b.avgProfitPerAcre - a.avgProfitPerAcre);
}

export async function getExpenseBreakdown(
  filters: DashboardFilters
): Promise<ExpenseBreakdown[]> {
  const where = buildWhere(filters);

  const rows = await prisma.fieldCropYear.findMany({
    where,
    select: {
      machineLaborCost: true,
      chemicalsCost: true,
      seedCost: true,
      fertilizerCost: true,
      rentCost: true,
      landImprovCost: true,
      insuranceExpense: true,
      miscExpense: true,
    },
  });

  if (rows.length === 0) return [];

  const categories = [
    { category: "Machine/Labor", values: rows.map((r) => d(r.machineLaborCost)) },
    { category: "Chemicals", values: rows.map((r) => d(r.chemicalsCost)) },
    { category: "Seed", values: rows.map((r) => d(r.seedCost)) },
    { category: "Fertilizer", values: rows.map((r) => d(r.fertilizerCost)) },
    { category: "Rent", values: rows.map((r) => d(r.rentCost)) },
    { category: "Land Improvement", values: rows.map((r) => d(r.landImprovCost)) },
    { category: "Insurance", values: rows.map((r) => d(r.insuranceExpense)) },
    { category: "Misc", values: rows.map((r) => d(r.miscExpense)) },
  ];

  const totals = categories.map((cat) => {
    const vals = cat.values.filter((v): v is number => v !== null);
    return {
      category: cat.category,
      amount: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
    };
  });

  const totalAmount = totals.reduce((sum, t) => sum + t.amount, 0);

  return totals.map((t) => ({
    ...t,
    percentage: totalAmount > 0 ? (t.amount / totalAmount) * 100 : 0,
  }));
}

export async function getRevenueBreakdown(
  filters: DashboardFilters
): Promise<RevenueBreakdown[]> {
  const where = buildWhere(filters);

  const rows = await prisma.fieldCropYear.findMany({
    where,
    select: {
      cropSale: true,
      govPayments: true,
      miscIncome: true,
      hedging: true,
      interestPatronage: true,
      insuranceIncome: true,
    },
  });

  if (rows.length === 0) return [];

  const categories = [
    { category: "Crop Sale", values: rows.map((r) => d(r.cropSale)) },
    { category: "Gov Payments", values: rows.map((r) => d(r.govPayments)) },
    { category: "Misc Income", values: rows.map((r) => d(r.miscIncome)) },
    { category: "Hedging", values: rows.map((r) => d(r.hedging)) },
    { category: "Interest/Patronage", values: rows.map((r) => d(r.interestPatronage)) },
    { category: "Insurance", values: rows.map((r) => d(r.insuranceIncome)) },
  ];

  const totals = categories.map((cat) => {
    const vals = cat.values.filter((v): v is number => v !== null);
    return {
      category: cat.category,
      amount: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
    };
  });

  const totalAmount = totals.reduce((sum, t) => sum + t.amount, 0);

  return totals.map((t) => ({
    ...t,
    percentage: totalAmount > 0 ? (t.amount / totalAmount) * 100 : 0,
  }));
}

export async function getYearOverYearFinancials(
  filters: DashboardFilters
): Promise<YearOverYearFinancial[]> {
  const where = buildWhere(filters);
  delete where.year;

  const rows = await prisma.fieldCropYear.findMany({
    where,
    select: {
      year: true,
      totalIncPerAcre: true,
      totalCostPerAcre: true,
      profitPerAcreByCrop: true,
      totalNetByCrop: true,
      cropId: true,
    },
  });

  const byYear = new Map<number, typeof rows>();
  for (const row of rows) {
    const arr = byYear.get(row.year) ?? [];
    arr.push(row);
    byYear.set(row.year, arr);
  }

  return Array.from(byYear.entries())
    .map(([year, group]) => {
      const incomes = group.map((r) => d(r.totalIncPerAcre)).filter((v): v is number => v !== null);
      const costs = group.map((r) => d(r.totalCostPerAcre)).filter((v): v is number => v !== null);
      const profits = group.map((r) => d(r.profitPerAcreByCrop)).filter((v): v is number => v !== null);
      const nets = group.map((r) => d(r.totalNetByCrop)).filter((v): v is number => v !== null);
      const uniqueCrops = new Set(group.map((r) => r.cropId));

      return {
        year,
        avgIncomePerAcre: incomes.length > 0 ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0,
        avgCostPerAcre: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
        avgProfitPerAcre: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
        totalNetProfit: nets.reduce((a, b) => a + b, 0),
        cropCount: uniqueCrops.size,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export async function getFinancialFilterOptions(): Promise<{
  years: FilterOption[];
  fields: FilterOption[];
  crops: FilterOption[];
  cropCategories: FilterOption[];
}> {
  const [years, fields, crops] = await Promise.all([
    prisma.fieldCropYear.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.field.findMany({
      where: { fieldCropYears: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.crop.findMany({ select: { name: true, category: true }, orderBy: { name: "asc" } }),
  ]);

  const cropCategories: FilterOption[] = [
    { label: "Corn", value: "CORN" },
    { label: "Edible Bean", value: "EDIBLE_BEAN" },
    { label: "Grain", value: "GRAIN" },
    { label: "Specialty", value: "SPECIALTY" },
    { label: "Forage", value: "FORAGE" },
  ];

  return {
    years: years.map((y) => ({ label: String(y.year), value: String(y.year) })),
    fields: fields.map((f) => ({ label: f.name, value: f.id })),
    crops: crops.map((c) => ({ label: c.name, value: c.name })),
    cropCategories,
  };
}

export async function getFinancialSummaryStats(): Promise<{
  totalRecords: number;
  totalFields: number;
  yearRange: string;
}> {
  const [count, fields, years] = await Promise.all([
    prisma.fieldCropYear.count(),
    prisma.field.count({ where: { fieldCropYears: { some: {} } } }),
    prisma.fieldCropYear.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "asc" } }),
  ]);

  return {
    totalRecords: count,
    totalFields: fields,
    yearRange: years.length > 0 ? `${years[0].year}-${years[years.length - 1].year}` : "N/A",
  };
}
