-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('TO_READ', 'READING', 'READ');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "summary" TEXT,
    "dateRead" TIMESTAMP(3),
    "status" "BookStatus" NOT NULL DEFAULT 'TO_READ',
    "sourceId" TEXT NOT NULL,
    "notes" TEXT,
    "readerId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BookSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookSource_name_key" ON "BookSource"("name");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BookSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
