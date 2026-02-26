import { NextRequest } from 'next/server';
import { getCropPerformance, getYieldTrends } from '@/services/cropService';
import { successResponse, handleApiError } from '@/utils/apiResponse';
import type { DashboardFilters } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: DashboardFilters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      cropId: searchParams.get('cropId') ?? undefined,
      fieldId: searchParams.get('fieldId') ?? undefined,
    };

    const [performance, trends] = await Promise.all([
      getCropPerformance(filters),
      getYieldTrends(filters),
    ]);

    return successResponse({ performance, trends });
  } catch (err) {
    return handleApiError(err);
  }
}
