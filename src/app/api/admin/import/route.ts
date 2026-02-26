import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import { isAdmin } from '@/lib/auth/guards';
import { parseExcel, persistCornData, persistEdibleData, persistPLData } from '@/services/importService';
import { successResponse, errorResponse, handleApiError } from '@/utils/apiResponse';
import type { ImportResult } from '@/types/import';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const admin = await isAdmin(user.id);
    if (!admin) {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided');
    }

    // Accept .xlsx, .xls, and .xlsm
    const validExts = ['.xlsx', '.xls', '.xlsm'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      return errorResponse('Invalid file type. Please upload an Excel file (.xlsx, .xls, or .xlsm)');
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size is 10MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = parseExcel(buffer);

    if (parseResult.valid.length === 0 && parseResult.errors.length > 0) {
      return errorResponse(parseResult.errors[0].message, 422);
    }

    if (parseResult.valid.length === 0) {
      return errorResponse('No valid rows found in the file', 422);
    }

    let result: ImportResult;
    switch (parseResult.fileType) {
      case 'corn':
        result = await persistCornData(parseResult.valid as Parameters<typeof persistCornData>[0], user.id, file.name);
        break;
      case 'edibles':
        result = await persistEdibleData(parseResult.valid as Parameters<typeof persistEdibleData>[0], user.id, file.name);
        break;
      case 'field_pl':
        result = await persistPLData(parseResult.valid as Parameters<typeof persistPLData>[0], user.id, file.name);
        break;
    }

    // Include parse errors
    result.errors = [...parseResult.errors, ...result.errors];
    result.rowsFailed += parseResult.errors.length;

    return successResponse(result, result.rowsFailed === 0 ? 200 : 207);
  } catch (err) {
    return handleApiError(err);
  }
}
