import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { isAdmin } from '@/lib/auth/guards';
import { parseExcel, persistData } from '@/services/importService';
import { successResponse, errorResponse, handleApiError } from '@/utils/apiResponse';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Admin role check (can't do this in middleware since Edge Runtime)
    const admin = await isAdmin(user.id);
    if (!admin) {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided');
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return errorResponse('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size is 10MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = parseExcel(buffer);

    if (parseResult.valid.length === 0) {
      return errorResponse('No valid rows found in the file', 422);
    }

    const summary = await persistData(parseResult.valid, user.id, file.name);

    // Include parse errors in the summary
    summary.errors = [...parseResult.errors, ...summary.errors];
    summary.rowsFailed += parseResult.errors.length;

    return successResponse(summary, summary.status === 'success' ? 200 : 207);
  } catch (err) {
    return handleApiError(err);
  }
}
