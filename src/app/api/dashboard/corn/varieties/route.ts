import { NextRequest } from 'next/server';
import { getCornVarietyPerformance, getCornFilterOptions } from '@/services/cornService';
import { successResponse, handleApiError } from '@/utils/apiResponse';
import type { DashboardFilters } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: DashboardFilters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      fieldId: searchParams.get('fieldId') ?? undefined,
      cornType: searchParams.get('cornType') ?? undefined,
      seedCompany: searchParams.get('seedCompany') ?? undefined,
    };

    const [varieties, filterOptions] = await Promise.all([
      getCornVarietyPerformance(filters),
      getCornFilterOptions(),
    ]);

    return successResponse({ varieties, filterOptions });
  } catch (err) {
    return handleApiError(err);
  }
}
