/**
 * Corn Service — Queries CornLoad table only
 */

import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import type { DashboardFilters } from "@/types/api";
import type {
  CornFieldSeason,
  CornYieldTrend,
  FilterOption,
} from "@/types/dashboard";

function d(v: Prisma.Decimal | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function buildWhere(filters: DashboardFilters): Prisma.CornLoadWhereInput {
  const where: Prisma.CornLoadWhereInput = {};
  if (filters.year) where.year = filters.year;
  if (filters.fieldId) where.fieldId = filters.fieldId;
  if (filters.cornType) where.cornType = filters.cornType as Prisma.EnumCornTypeFilter;
  if (filters.seedCompany) {
    where.variety = { seedCompany: { name: filters.seedCompany } };
  }
  return where;
}

export async function getCornFieldSeasons(
  filters: DashboardFilters
): Promise<CornFieldSeason[]> {
  const where = buildWhere(filters);

  const loads = await prisma.cornLoad.findMany({
    where,
    include: { field: true, variety: { include: { seedCompany: true } } },
    orderBy: [{ year: "desc" }, { field: { name: "asc" } }],
  });

  // Group by field + year
  const groups = new Map<string, typeof loads>();
  for (const load of loads) {
    const key = `${load.fieldId}|${load.year}`;
    const arr = groups.get(key) ?? [];
    arr.push(load);
    groups.set(key, arr);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const moistures = group.map((l) => d(l.moisture)).filter((v): v is number => v !== null);
    const testWeights = group.map((l) => d(l.testWeight)).filter((v): v is number => v !== null);
    const dryYields = group.map((l) => d(l.dryYield)).filter((v): v is number => v !== null);
    const commonDryYields = group.map((l) => d(l.commonDryYield)).filter((v): v is number => v !== null);
    const adjTpas = group.map((l) => d(l.adjTpa)).filter((v): v is number => v !== null);
    const shrinks = group.map((l) => d(l.shrink)).filter((v): v is number => v !== null);

    return {
      fieldName: first.field.name,
      fieldNumber: first.field.fieldNumber ?? 0,
      year: first.year,
      acres: Number(first.field.acres),
      cornType: first.cornType,
      seedCompany: first.variety?.seedCompany?.name ?? "",
      variety: first.variety?.name ?? null,
      loadCount: group.length,
      totalNetWeight: group.reduce((sum, l) => sum + (d(l.netWeight) ?? 0), 0) || null,
      avgMoisture: moistures.length > 0 ? moistures.reduce((a, b) => a + b, 0) / moistures.length : null,
      avgTestWeight: testWeights.length > 0 ? testWeights.reduce((a, b) => a + b, 0) / testWeights.length : null,
      totalDryBushel: group.reduce((sum, l) => sum + (d(l.dryBushel) ?? 0), 0) || null,
      avgDryYield: dryYields.length > 0 ? dryYields.reduce((a, b) => a + b, 0) / dryYields.length : null,
      avgCommonDryYield: commonDryYields.length > 0 ? commonDryYields.reduce((a, b) => a + b, 0) / commonDryYields.length : null,
      totalDmTons: group.reduce((sum, l) => sum + (d(l.dmTons) ?? 0), 0) || null,
      avgAdjTpa: adjTpas.length > 0 ? adjTpas.reduce((a, b) => a + b, 0) / adjTpas.length : null,
      avgShrink: shrinks.length > 0 ? shrinks.reduce((a, b) => a + b, 0) / shrinks.length : null,
    };
  });
}

export async function getCornYieldTrends(
  filters: DashboardFilters
): Promise<CornYieldTrend[]> {
  const where = buildWhere(filters);
  delete where.year; // We want all years for trends

  const loads = await prisma.cornLoad.findMany({
    where,
    select: {
      year: true,
      dryYield: true,
      moisture: true,
      testWeight: true,
      fieldId: true,
    },
  });

  // Also fetch rainfall
  const seasons = await prisma.seasonData.findMany();
  const rainfallMap = new Map(seasons.map((s) => [s.year, s]));

  // Group by year
  const byYear = new Map<number, typeof loads>();
  for (const load of loads) {
    const arr = byYear.get(load.year) ?? [];
    arr.push(load);
    byYear.set(load.year, arr);
  }

  return Array.from(byYear.entries())
    .map(([year, group]) => {
      const dryYields = group.map((l) => d(l.dryYield)).filter((v): v is number => v !== null);
      const moistures = group.map((l) => d(l.moisture)).filter((v): v is number => v !== null);
      const testWeights = group.map((l) => d(l.testWeight)).filter((v): v is number => v !== null);
      const uniqueFields = new Set(group.map((l) => l.fieldId));
      const rain = rainfallMap.get(year);

      return {
        year,
        avgDryYield: dryYields.length > 0 ? dryYields.reduce((a, b) => a + b, 0) / dryYields.length : 0,
        avgMoisture: moistures.length > 0 ? moistures.reduce((a, b) => a + b, 0) / moistures.length : 0,
        avgTestWeight: testWeights.length > 0 ? testWeights.reduce((a, b) => a + b, 0) / testWeights.length : 0,
        totalLoads: group.length,
        fieldCount: uniqueFields.size,
        rainAprSep: rain ? d(rain.rainAprSep) : null,
        rainMayAug: rain ? d(rain.rainMayAug) : null,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export async function getCornVarietyPerformance(
  filters: DashboardFilters
): Promise<
  {
    variety: string;
    seedCompany: string;
    loadCount: number;
    avgDryYield: number | null;
    avgMoisture: number | null;
    avgTestWeight: number | null;
  }[]
> {
  const where = buildWhere(filters);

  const loads = await prisma.cornLoad.findMany({
    where: { ...where, varietyId: { not: null } },
    include: { variety: { include: { seedCompany: true } } },
  });

  const byVariety = new Map<string, typeof loads>();
  for (const load of loads) {
    if (!load.variety) continue;
    const key = load.variety.id;
    const arr = byVariety.get(key) ?? [];
    arr.push(load);
    byVariety.set(key, arr);
  }

  return Array.from(byVariety.values())
    .map((group) => {
      const first = group[0];
      const dryYields = group.map((l) => d(l.dryYield)).filter((v): v is number => v !== null);
      const moistures = group.map((l) => d(l.moisture)).filter((v): v is number => v !== null);
      const testWeights = group.map((l) => d(l.testWeight)).filter((v): v is number => v !== null);

      return {
        variety: first.variety?.name ?? "",
        seedCompany: first.variety?.seedCompany?.name ?? "",
        loadCount: group.length,
        avgDryYield: dryYields.length > 0 ? dryYields.reduce((a, b) => a + b, 0) / dryYields.length : null,
        avgMoisture: moistures.length > 0 ? moistures.reduce((a, b) => a + b, 0) / moistures.length : null,
        avgTestWeight: testWeights.length > 0 ? testWeights.reduce((a, b) => a + b, 0) / testWeights.length : null,
      };
    })
    .sort((a, b) => (b.avgDryYield ?? 0) - (a.avgDryYield ?? 0));
}

export async function getCornFilterOptions(): Promise<{
  years: FilterOption[];
  fields: FilterOption[];
  cornTypes: FilterOption[];
  seedCompanies: FilterOption[];
}> {
  const [years, fields, companies] = await Promise.all([
    prisma.cornLoad.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.field.findMany({
      where: { cornLoads: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.seedCompany.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const cornTypes: FilterOption[] = [
    { label: "Dry Corn", value: "DRY_CORN" },
    { label: "Silage", value: "SILAGE" },
    { label: "High Moisture Corn", value: "HIGH_MOISTURE_CORN" },
    { label: "Organic Corn", value: "ORGANIC_CORN" },
    { label: "Earlage", value: "EARLAGE" },
  ];

  return {
    years: years.map((y) => ({ label: String(y.year), value: String(y.year) })),
    fields: fields.map((f) => ({ label: f.name, value: f.id })),
    cornTypes,
    seedCompanies: companies.map((c) => ({ label: c.name, value: c.name })),
  };
}

export async function getCornSummary(): Promise<{
  totalLoads: number;
  totalFields: number;
  yearRange: string;
}> {
  const [count, fields, years] = await Promise.all([
    prisma.cornLoad.count(),
    prisma.field.count({ where: { cornLoads: { some: {} } } }),
    prisma.cornLoad.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "asc" } }),
  ]);

  return {
    totalLoads: count,
    totalFields: fields,
    yearRange: years.length > 0 ? `${years[0].year}-${years[years.length - 1].year}` : "N/A",
  };
}
