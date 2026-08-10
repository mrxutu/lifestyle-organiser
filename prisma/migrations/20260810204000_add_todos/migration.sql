-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN "showTodos" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TodoPriority" NOT NULL DEFAULT 'NORMAL',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoOwner" (
    "id" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TodoOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Todo_householdId_priority_createdAt_idx" ON "Todo"("householdId", "priority", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TodoOwner_todoId_userId_key" ON "TodoOwner"("todoId", "userId");

-- CreateIndex
CREATE INDEX "TodoOwner_userId_idx" ON "TodoOwner"("userId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoOwner" ADD CONSTRAINT "TodoOwner_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoOwner" ADD CONSTRAINT "TodoOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
