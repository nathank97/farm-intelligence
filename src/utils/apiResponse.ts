import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status });
}

export function handleApiError(err: unknown): NextResponse<ApiResponse<never>> {
  console.error('API Error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return errorResponse(message, 500);
}
