import { getCropPerformance } from './cropService';
import { getFinancialSummary } from './financialService';
import { generateCsv } from '@/utils/csvExport';
import type { DashboardFilters } from '@/types/api';

export async function exportCropPerformance(filters: DashboardFilters): Promise<string> {
  const data = await getCropPerformance(filters);
  return generateCsv(data, [
    { key: 'fieldName', header: 'Field Name' },
    { key: 'cropName', header: 'Crop Name' },
    { key: 'varietyName', header: 'Variety' },
    { key: 'year', header: 'Year' },
    { key: 'acreage', header: 'Acreage' },
    { key: 'yieldPerAcre', header: 'Yield Per Acre' },
    { key: 'totalYield', header: 'Total Yield' },
  ]);
}

export async function exportFinancialSummary(filters: DashboardFilters): Promise<string> {
  const data = await getFinancialSummary(filters);
  return generateCsv(data, [
    { key: 'fieldName', header: 'Field Name' },
    { key: 'cropName', header: 'Crop Name' },
    { key: 'year', header: 'Year' },
    { key: 'totalCost', header: 'Total Cost' },
    { key: 'totalRevenue', header: 'Total Revenue' },
    { key: 'grossMargin', header: 'Gross Margin' },
    { key: 'costPerAcre', header: 'Cost Per Acre' },
    { key: 'revenuePerAcre', header: 'Revenue Per Acre' },
  ]);
}
