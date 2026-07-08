/*
  Warnings:

  - The `unit` column on the `Ingredient` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('TSP', 'TBSP', 'G', 'ML', 'LITRE', 'PINT', 'OZ', 'LB');

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "unit",
ADD COLUMN     "unit" "MeasurementUnit";
