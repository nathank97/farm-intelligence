-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "acreage" DECIMAL(10,2) NOT NULL,
    "soil_type" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "varieties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "crop_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "varieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_crop_years" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "field_id" UUID NOT NULL,
    "crop_id" UUID NOT NULL,
    "variety_id" UUID,
    "year" INTEGER NOT NULL,
    "yield_per_acre" DECIMAL(10,2),
    "total_yield" DECIMAL(12,2),
    "planting_date" DATE,
    "harvest_date" DATE,
    "quality_metrics" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_crop_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "field_crop_year_id" UUID NOT NULL,
    "seed_cost" DECIMAL(10,2),
    "fertilizer_cost" DECIMAL(10,2),
    "spray_cost" DECIMAL(10,2),
    "operations_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(12,2),
    "revenue_per_tonne" DECIMAL(10,2),
    "total_revenue" DECIMAL(12,2),
    "gross_margin" DECIMAL(12,2),
    "cost_per_acre" DECIMAL(10,2),
    "revenue_per_acre" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "rows_processed" INTEGER NOT NULL,
    "rows_failed" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fields_name_key" ON "fields"("name");

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE UNIQUE INDEX "varieties_crop_id_name_key" ON "varieties"("crop_id", "name");

-- CreateIndex
CREATE INDEX "field_crop_years_year_idx" ON "field_crop_years"("year");

-- CreateIndex
CREATE INDEX "field_crop_years_crop_id_idx" ON "field_crop_years"("crop_id");

-- CreateIndex
CREATE UNIQUE INDEX "field_crop_years_field_id_crop_id_year_key" ON "field_crop_years"("field_id", "crop_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "financials_field_crop_year_id_key" ON "financials"("field_crop_year_id");

-- CreateIndex
CREATE INDEX "import_logs_user_id_idx" ON "import_logs"("user_id");

-- CreateIndex
CREATE INDEX "import_logs_created_at_idx" ON "import_logs"("created_at");

-- AddForeignKey
ALTER TABLE "varieties" ADD CONSTRAINT "varieties_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_crop_years" ADD CONSTRAINT "field_crop_years_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_crop_years" ADD CONSTRAINT "field_crop_years_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_crop_years" ADD CONSTRAINT "field_crop_years_variety_id_fkey" FOREIGN KEY ("variety_id") REFERENCES "varieties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financials" ADD CONSTRAINT "financials_field_crop_year_id_fkey" FOREIGN KEY ("field_crop_year_id") REFERENCES "field_crop_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
