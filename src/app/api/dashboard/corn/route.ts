import { NextRequest } from 'next/server';
import { getCornFieldSeasons, getCornYieldTrends, getCornFilterOptions } from '@/services/cornService';
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

    const [fieldSeasons, yieldTrends, filterOptions] = await Promise.all([
      getCornFieldSeasons(filters),
      getCornYieldTrends(filters),
      getCornFilterOptions(),
    ]);

    return successResponse({ fieldSeasons, yieldTrends, filterOptions });
  } catch (err) {
    return handleApiError(err);
  }
}
