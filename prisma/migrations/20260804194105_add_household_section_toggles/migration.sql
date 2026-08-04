-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "showBooks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showCalendar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showRecipes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showWatchlist" BOOLEAN NOT NULL DEFAULT true;
