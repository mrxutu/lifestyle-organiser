-- Recipe chef assignment is required in the final schema. Add it nullable only
-- long enough to preserve existing rows by using their author as the initial chef.
ALTER TABLE "Recipe" ADD COLUMN "chefId" TEXT;

UPDATE "Recipe"
SET "chefId" = "authorId";

ALTER TABLE "Recipe" ALTER COLUMN "chefId" SET NOT NULL;

ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_chefId_fkey"
FOREIGN KEY ("chefId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Viewer assignments replace implicit household-wide Profile inclusion. Existing
-- entries are assigned to every currently active member of their household so
-- the migration preserves their previous user-facing visibility.
CREATE TABLE "WatchlistViewer" (
    "id" TEXT NOT NULL,
    "watchlistEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WatchlistViewer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchlistViewer_watchlistEntryId_userId_key"
ON "WatchlistViewer"("watchlistEntryId", "userId");

INSERT INTO "WatchlistViewer" ("id", "watchlistEntryId", "userId")
SELECT CONCAT('backfill_', MD5(entry."id" || ':' || member."id")), entry."id", member."id"
FROM "WatchlistEntry" AS entry
INNER JOIN "User" AS member
  ON member."householdId" = entry."householdId"
 AND member."isActive" = true;

ALTER TABLE "WatchlistViewer"
ADD CONSTRAINT "WatchlistViewer_watchlistEntryId_fkey"
FOREIGN KEY ("watchlistEntryId") REFERENCES "WatchlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WatchlistViewer"
ADD CONSTRAINT "WatchlistViewer_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
