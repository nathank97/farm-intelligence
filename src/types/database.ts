// Frontend-safe mirrors of Prisma models
// Uses number instead of Decimal, string for dates

export type UserRole = 'ADMIN' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Field {
  id: string;
  name: string;
  acreage: number;
  soilType: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Variety {
  id: string;
  name: string;
  cropId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldCropYear {
  id: string;
  fieldId: string;
  cropId: string;
  varietyId: string | null;
  year: number;
  yieldPerAcre: number | null;
  totalYield: number | null;
  plantingDate: string | null;
  harvestDate: string | null;
  qualityMetrics: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined relations (optional)
  field?: Field;
  crop?: Crop;
  variety?: Variety | null;
  financials?: Financial | null;
}

export interface Financial {
  id: string;
  fieldCropYearId: string;
  seedCost: number | null;
  fertilizerCost: number | null;
  sprayCost: number | null;
  operationsCost: number | null;
  totalCost: number | null;
  revenuePerTonne: number | null;
  totalRevenue: number | null;
  grossMargin: number | null;
  costPerAcre: number | null;
  revenuePerAcre: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportLog {
  id: string;
  userId: string;
  fileName: string;
  rowsProcessed: number;
  rowsFailed: number;
  status: 'success' | 'partial' | 'failed';
  errors: Array<{ row: number; field: string; message: string }> | null;
  createdAt: string;
}
