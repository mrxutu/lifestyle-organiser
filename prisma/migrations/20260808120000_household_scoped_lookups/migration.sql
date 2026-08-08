ALTER TABLE "EventType" ADD COLUMN "householdId" TEXT;
ALTER TABLE "WatchlistSource" ADD COLUMN "householdId" TEXT;
ALTER TABLE "BookSource" ADD COLUMN "householdId" TEXT;

-- Shared legacy rows are duplicated per referencing household. Unused rows are
-- copied to every existing household so no user-managed lookup value is lost.
CREATE TEMP TABLE "_EventTypeHousehold" AS
WITH targets AS (
  SELECT et.id AS "oldId", e."householdId" FROM "EventType" et JOIN "Event" e ON e."eventTypeId" = et.id
  UNION
  SELECT et.id, h.id FROM "EventType" et CROSS JOIN "Household" h
  WHERE NOT EXISTS (SELECT 1 FROM "Event" e WHERE e."eventTypeId" = et.id)
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY "oldId" ORDER BY "householdId") AS position FROM targets
)
SELECT "oldId", "householdId",
  CASE WHEN position = 1 THEN "oldId" ELSE "oldId" || '_hh_' || md5("householdId") END AS "newId"
FROM ranked;

CREATE TEMP TABLE "_WatchlistSourceHousehold" AS
WITH targets AS (
  SELECT ws.id AS "oldId", we."householdId" FROM "WatchlistSource" ws JOIN "WatchlistEntry" we ON we."sourceId" = ws.id
  UNION
  SELECT ws.id, h.id FROM "WatchlistSource" ws CROSS JOIN "Household" h
  WHERE NOT EXISTS (SELECT 1 FROM "WatchlistEntry" we WHERE we."sourceId" = ws.id)
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY "oldId" ORDER BY "householdId") AS position FROM targets
)
SELECT "oldId", "householdId",
  CASE WHEN position = 1 THEN "oldId" ELSE "oldId" || '_hh_' || md5("householdId") END AS "newId"
FROM ranked;

CREATE TEMP TABLE "_BookSourceHousehold" AS
WITH targets AS (
  SELECT bs.id AS "oldId", b."householdId" FROM "BookSource" bs JOIN "Book" b ON b."sourceId" = bs.id
  UNION
  SELECT bs.id, h.id FROM "BookSource" bs CROSS JOIN "Household" h
  WHERE NOT EXISTS (SELECT 1 FROM "Book" b WHERE b."sourceId" = bs.id)
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY "oldId" ORDER BY "householdId") AS position FROM targets
)
SELECT "oldId", "householdId",
  CASE WHEN position = 1 THEN "oldId" ELSE "oldId" || '_hh_' || md5("householdId") END AS "newId"
FROM ranked;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "EventType" WHERE id NOT IN (SELECT "oldId" FROM "_EventTypeHousehold"))
    OR EXISTS (SELECT 1 FROM "WatchlistSource" WHERE id NOT IN (SELECT "oldId" FROM "_WatchlistSourceHousehold"))
    OR EXISTS (SELECT 1 FROM "BookSource" WHERE id NOT IN (SELECT "oldId" FROM "_BookSourceHousehold")) THEN
    RAISE EXCEPTION 'Cannot assign legacy lookup rows because no household exists';
  END IF;
END $$;

-- Remove the legacy global uniqueness before inserting household-specific copies.
DROP INDEX "WatchlistSource_name_key";
DROP INDEX "BookSource_name_key";

INSERT INTO "EventType" (id, name, color, "householdId")
SELECT m."newId", et.name, et.color, m."householdId" FROM "_EventTypeHousehold" m
JOIN "EventType" et ON et.id = m."oldId" WHERE m."newId" <> m."oldId";
UPDATE "EventType" et SET "householdId" = m."householdId" FROM "_EventTypeHousehold" m
WHERE et.id = m."oldId" AND m."newId" = m."oldId";
UPDATE "Event" e SET "eventTypeId" = m."newId" FROM "_EventTypeHousehold" m
WHERE e."eventTypeId" = m."oldId" AND e."householdId" = m."householdId";

INSERT INTO "WatchlistSource" (id, name, "householdId")
SELECT m."newId", ws.name, m."householdId" FROM "_WatchlistSourceHousehold" m
JOIN "WatchlistSource" ws ON ws.id = m."oldId" WHERE m."newId" <> m."oldId";
UPDATE "WatchlistSource" ws SET "householdId" = m."householdId" FROM "_WatchlistSourceHousehold" m
WHERE ws.id = m."oldId" AND m."newId" = m."oldId";
UPDATE "WatchlistEntry" we SET "sourceId" = m."newId" FROM "_WatchlistSourceHousehold" m
WHERE we."sourceId" = m."oldId" AND we."householdId" = m."householdId";

INSERT INTO "BookSource" (id, name, "householdId")
SELECT m."newId", bs.name, m."householdId" FROM "_BookSourceHousehold" m
JOIN "BookSource" bs ON bs.id = m."oldId" WHERE m."newId" <> m."oldId";
UPDATE "BookSource" bs SET "householdId" = m."householdId" FROM "_BookSourceHousehold" m
WHERE bs.id = m."oldId" AND m."newId" = m."oldId";
UPDATE "Book" b SET "sourceId" = m."newId" FROM "_BookSourceHousehold" m
WHERE b."sourceId" = m."oldId" AND b."householdId" = m."householdId";

ALTER TABLE "EventType" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "WatchlistSource" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "BookSource" ALTER COLUMN "householdId" SET NOT NULL;
CREATE UNIQUE INDEX "EventType_householdId_name_key" ON "EventType"("householdId", "name");
CREATE UNIQUE INDEX "WatchlistSource_householdId_name_key" ON "WatchlistSource"("householdId", "name");
CREATE UNIQUE INDEX "BookSource_householdId_name_key" ON "BookSource"("householdId", "name");
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchlistSource" ADD CONSTRAINT "WatchlistSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookSource" ADD CONSTRAINT "BookSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
