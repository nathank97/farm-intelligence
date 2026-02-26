import { NextResponse } from 'next/server';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api';

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function errorResponse(message: string, status = 400, code?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false as const, error: { message, code } }, { status });
}

export function handleApiError(err: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return errorResponse(message, 500);
}
