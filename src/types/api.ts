export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ row: number; field: string; message: string }>;
}

export interface DashboardFilters {
  year?: number;
  cropId?: string;
  fieldId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
