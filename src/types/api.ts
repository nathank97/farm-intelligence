/**
 * API Types — Unified
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface DashboardFilters {
  year?: number;
  fieldId?: string;
  cropCategory?: string;
  cornType?: string;
  beanType?: string;
  seedCompany?: string;
  crop?: string;
  variety?: string;
}
