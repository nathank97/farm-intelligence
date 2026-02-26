import { NextRequest } from 'next/server';
import { getCropProfitability, getFinancialFilterOptions } from '@/services/financialService';
import { successResponse, handleApiError } from '@/utils/apiResponse';
import type { DashboardFilters } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: DashboardFilters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      fieldId: searchParams.get('fieldId') ?? undefined,
      cropCategory: searchParams.get('cropCategory') ?? undefined,
    };

    const [crops, filterOptions] = await Promise.all([
      getCropProfitability(filters),
      getFinancialFilterOptions(),
    ]);

    return successResponse({ crops, filterOptions });
  } catch (err) {
    return handleApiError(err);
  }
}
