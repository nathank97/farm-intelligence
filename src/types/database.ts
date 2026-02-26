// Frontend-safe mirrors of Prisma models
// Uses number instead of Decimal, string for dates

export type UserRole = 'ADMIN' | 'VIEWER';
export type CropCategory = 'CORN' | 'EDIBLE_BEAN' | 'GRAIN' | 'SPECIALTY' | 'FORAGE';
export type CornType = 'DRY_CORN' | 'SILAGE' | 'HIGH_MOISTURE_CORN' | 'ORGANIC_CORN' | 'EARLAGE';
export type BeanType = 'BLACKS' | 'DARK_REDS' | 'LIGHT_REDS' | 'ORGANIC_BLACKS' | 'ORGANIC_DARK_REDS' | 'PINTOS' | 'SMALL_REDS' | 'WHITES';

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
  fieldNumber: number | null;
  name: string;
  acres: number;
  areaCode: number | null;
  patternTile: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  name: string;
  category: CropCategory;
  createdAt: string;
  updatedAt: string;
}

export interface SeedCompany {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variety {
  id: string;
  name: string;
  seedCompanyId: string | null;
  cropCategory: CropCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ImportLog {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  rowsProcessed: number;
  rowsFailed: number;
  status: 'success' | 'partial' | 'failed';
  errors: Array<{ row: number; field: string; message: string }> | null;
  createdAt: string;
}
