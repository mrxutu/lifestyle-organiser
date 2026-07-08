-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_recipeId_fkey";

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "method" TEXT;

-- DropTable
DROP TABLE "Step";

