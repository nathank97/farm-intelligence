/**
 * Edible Bean Service — Queries EdibleLoad table only
 */

import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import type { DashboardFilters } from "@/types/api";
import type {
  EdibleFieldSeason,
  EdibleYieldTrend,
  DockageBreakdown,
  FilterOption,
} from "@/types/dashboard";

function d(v: Prisma.Decimal | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function buildWhere(filters: DashboardFilters): Prisma.EdibleLoadWhereInput {
  const where: Prisma.EdibleLoadWhereInput = {};
  if (filters.year) where.year = filters.year;
  if (filters.fieldId) where.fieldId = filters.fieldId;
  if (filters.beanType) where.beanType = filters.beanType as Prisma.EnumBeanTypeFilter;
  if (filters.variety) where.varietyId = filters.variety;
  return where;
}

export async function getEdibleFieldSeasons(
  filters: DashboardFilters
): Promise<EdibleFieldSeason[]> {
  const where = buildWhere(filters);

  const loads = await prisma.edibleLoad.findMany({
    where,
    include: { field: true, variety: true },
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
    const moistures = group.map((l) => d(l.avgMoisture)).filter((v): v is number => v !== null);
    const damages = group.map((l) => d(l.avgDamage)).filter((v): v is number => v !== null);
    const fms = group.map((l) => d(l.avgFm)).filter((v): v is number => v !== null);
    const skinChecks = group.map((l) => d(l.avgSkinCheck)).filter((v): v is number => v !== null);
    const sprouts = group.map((l) => d(l.avgSproutsSplits)).filter((v): v is number => v !== null);
    const yields = group.map((l) => d(l.yield)).filter((v): v is number => v !== null);
    const finalPrices = group.map((l) => d(l.finalPrice)).filter((v): v is number => v !== null);

    return {
      fieldName: first.field.name,
      year: first.year,
      acres: Number(first.field.acres),
      beanType: first.beanType,
      variety: first.variety?.name ?? null,
      loadCount: group.length,
      avgMoisture: moistures.length > 0 ? moistures.reduce((a, b) => a + b, 0) / moistures.length : null,
      avgDamage: damages.length > 0 ? damages.reduce((a, b) => a + b, 0) / damages.length : null,
      avgFm: fms.length > 0 ? fms.reduce((a, b) => a + b, 0) / fms.length : null,
      avgSkinCheck: skinChecks.length > 0 ? skinChecks.reduce((a, b) => a + b, 0) / skinChecks.length : null,
      avgSproutsSplits: sprouts.length > 0 ? sprouts.reduce((a, b) => a + b, 0) / sprouts.length : null,
      totalGrossUnits: group.reduce((sum, l) => sum + (d(l.grossUnits) ?? 0), 0) || null,
      totalNetUnits: group.reduce((sum, l) => sum + (d(l.netUnits) ?? 0), 0) || null,
      yield: yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : null,
      totalDollarDocked: group.reduce((sum, l) => sum + (d(l.totalDollarDocked) ?? 0), 0) || null,
      perAcDocked: group.reduce((sum, l) => sum + (d(l.perAcDocked) ?? 0), 0) / group.length || null,
      finalPrice: finalPrices.length > 0 ? finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length : null,
    };
  });
}

export async function getEdibleYieldTrends(
  filters: DashboardFilters
): Promise<EdibleYieldTrend[]> {
  const where = buildWhere(filters);
  delete where.year;

  const loads = await prisma.edibleLoad.findMany({
    where,
    select: {
      year: true,
      beanType: true,
      yield: true,
      perAcDocked: true,
      fieldId: true,
    },
  });

  // Group by year + beanType
  const byKey = new Map<string, typeof loads>();
  for (const load of loads) {
    const key = `${load.year}|${load.beanType}`;
    const arr = byKey.get(key) ?? [];
    arr.push(load);
    byKey.set(key, arr);
  }

  return Array.from(byKey.entries())
    .map(([key, group]) => {
      const [yearStr, beanType] = key.split("|");
      const yields = group.map((l) => d(l.yield)).filter((v): v is number => v !== null);
      const perAcs = group.map((l) => d(l.perAcDocked)).filter((v): v is number => v !== null);
      const uniqueFields = new Set(group.map((l) => l.fieldId));

      return {
        year: Number(yearStr),
        beanType,
        avgYield: yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0,
        avgPerAcDocked: perAcs.length > 0 ? perAcs.reduce((a, b) => a + b, 0) / perAcs.length : 0,
        loadCount: group.length,
        fieldCount: uniqueFields.size,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export async function getDockageBreakdown(
  filters: DashboardFilters
): Promise<DockageBreakdown[]> {
  const where = buildWhere(filters);

  const loads = await prisma.edibleLoad.findMany({
    where,
    select: {
      avgMoisture: true,
      moistDollarDocked: true,
      moistPerAcDocked: true,
      avgDamage: true,
      damageDollarDocked: true,
      damagePerAcDocked: true,
      avgFm: true,
      fmDollarDocked: true,
      fmPerAcDocked: true,
      avgSkinCheck: true,
      skinCheckDollarDocked: true,
      skinCheckPerAc: true,
      avgSproutsSplits: true,
      sproutsDollarDocked: true,
      sproutsPerAcDocked: true,
    },
  });

  if (loads.length === 0) return [];

  const categories = [
    {
      category: "Moisture",
      values: loads.map((l) => d(l.avgMoisture)),
      dollars: loads.map((l) => d(l.moistDollarDocked)),
      perAc: loads.map((l) => d(l.moistPerAcDocked)),
    },
    {
      category: "Damage",
      values: loads.map((l) => d(l.avgDamage)),
      dollars: loads.map((l) => d(l.damageDollarDocked)),
      perAc: loads.map((l) => d(l.damagePerAcDocked)),
    },
    {
      category: "FM",
      values: loads.map((l) => d(l.avgFm)),
      dollars: loads.map((l) => d(l.fmDollarDocked)),
      perAc: loads.map((l) => d(l.fmPerAcDocked)),
    },
    {
      category: "Skin Checks",
      values: loads.map((l) => d(l.avgSkinCheck)),
      dollars: loads.map((l) => d(l.skinCheckDollarDocked)),
      perAc: loads.map((l) => d(l.skinCheckPerAc)),
    },
    {
      category: "Sprouts/Splits",
      values: loads.map((l) => d(l.avgSproutsSplits)),
      dollars: loads.map((l) => d(l.sproutsDollarDocked)),
      perAc: loads.map((l) => d(l.sproutsPerAcDocked)),
    },
  ];

  return categories.map((cat) => {
    const vals = cat.values.filter((v): v is number => v !== null);
    const dols = cat.dollars.filter((v): v is number => v !== null);
    const perAcs = cat.perAc.filter((v): v is number => v !== null);

    return {
      category: cat.category,
      avgValue: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      totalDollarDocked: dols.reduce((a, b) => a + b, 0),
      avgPerAcDocked: perAcs.length > 0 ? perAcs.reduce((a, b) => a + b, 0) / perAcs.length : 0,
    };
  });
}

export async function getEdibleFilterOptions(): Promise<{
  years: FilterOption[];
  fields: FilterOption[];
  beanTypes: FilterOption[];
  varieties: FilterOption[];
}> {
  const [years, fields, varieties] = await Promise.all([
    prisma.edibleLoad.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.field.findMany({
      where: { edibleLoads: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.variety.findMany({
      where: { cropCategory: "EDIBLE_BEAN" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const beanTypes: FilterOption[] = [
    { label: "Blacks", value: "BLACKS" },
    { label: "Dark Reds", value: "DARK_REDS" },
    { label: "Light Reds", value: "LIGHT_REDS" },
    { label: "Organic Blacks", value: "ORGANIC_BLACKS" },
    { label: "Organic Dark Reds", value: "ORGANIC_DARK_REDS" },
    { label: "Pintos", value: "PINTOS" },
    { label: "Small Reds", value: "SMALL_REDS" },
    { label: "Whites", value: "WHITES" },
  ];

  return {
    years: years.map((y) => ({ label: String(y.year), value: String(y.year) })),
    fields: fields.map((f) => ({ label: f.name, value: f.id })),
    beanTypes,
    varieties: varieties.map((v) => ({ label: v.name, value: v.id })),
  };
}

export async function getEdibleSummary(): Promise<{
  totalLoads: number;
  totalFields: number;
  yearRange: string;
}> {
  const [count, fields, years] = await Promise.all([
    prisma.edibleLoad.count(),
    prisma.field.count({ where: { edibleLoads: { some: {} } } }),
    prisma.edibleLoad.findMany({ select: { year: true }, distinct: ["year"], orderBy: { year: "asc" } }),
  ]);

  return {
    totalLoads: count,
    totalFields: fields,
    yearRange: years.length > 0 ? `${years[0].year}-${years[years.length - 1].year}` : "N/A",
  };
}
