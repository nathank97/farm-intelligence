import { NextRequest } from 'next/server';
import { getEdibleFieldSeasons, getEdibleYieldTrends, getEdibleFilterOptions } from '@/services/edibleService';
import { successResponse, handleApiError } from '@/utils/apiResponse';
import type { DashboardFilters } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: DashboardFilters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      fieldId: searchParams.get('fieldId') ?? undefined,
      beanType: searchParams.get('beanType') ?? undefined,
      variety: searchParams.get('variety') ?? undefined,
    };

    const [fieldSeasons, yieldTrends, filterOptions] = await Promise.all([
      getEdibleFieldSeasons(filters),
      getEdibleYieldTrends(filters),
      getEdibleFilterOptions(),
    ]);

    return successResponse({ fieldSeasons, yieldTrends, filterOptions });
  } catch (err) {
    return handleApiError(err);
  }
}
