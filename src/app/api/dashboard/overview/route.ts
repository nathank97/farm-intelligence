import { getCornSummary } from '@/services/cornService';
import { getEdibleSummary } from '@/services/edibleService';
import { getFinancialSummaryStats } from '@/services/financialService';
import { successResponse, handleApiError } from '@/utils/apiResponse';

export async function GET() {
  try {
    const [corn, edibles, financial] = await Promise.all([
      getCornSummary(),
      getEdibleSummary(),
      getFinancialSummaryStats(),
    ]);

    return successResponse({ corn, edibles, financial });
  } catch (err) {
    return handleApiError(err);
  }
}
