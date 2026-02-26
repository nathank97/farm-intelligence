import { NextRequest } from 'next/server';
import { getDockageBreakdown, getEdibleFilterOptions } from '@/services/edibleService';
import { successResponse, handleApiError } from '@/utils/apiResponse';
import type { DashboardFilters } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters: DashboardFilters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      fieldId: searchParams.get('fieldId') ?? undefined,
      beanType: searchParams.get('beanType') ?? undefined,
    };

    const [dockage, filterOptions] = await Promise.all([
      getDockageBreakdown(filters),
      getEdibleFilterOptions(),
    ]);

    return successResponse({ dockage, filterOptions });
  } catch (err) {
    return handleApiError(err);
  }
}
