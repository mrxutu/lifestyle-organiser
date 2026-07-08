/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReminderRecipient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_householdId_fkey";

-- DropForeignKey
ALTER TABLE "ReminderRecipient" DROP CONSTRAINT "ReminderRecipient_reminderId_fkey";

-- DropForeignKey
ALTER TABLE "ReminderRecipient" DROP CONSTRAINT "ReminderRecipient_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "leadTimeDays" INTEGER,
ADD COLUMN     "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Reminder";

-- DropTable
DROP TABLE "ReminderRecipient";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";
