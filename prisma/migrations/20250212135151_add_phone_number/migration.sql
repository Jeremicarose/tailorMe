/*
  Warnings:

  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - Made the column `endTime` on table `Availability` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startTime` on table `Availability` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `availabilityId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedDeliveryDate` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tailorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Availability_tailorId_fkey" FOREIGN KEY ("tailorId") REFERENCES "Tailor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Availability" ("createdAt", "date", "endTime", "id", "startTime", "status", "tailorId", "updatedAt") SELECT "createdAt", "date", "endTime", "id", "startTime", "status", "tailorId", "updatedAt" FROM "Availability";
DROP TABLE "Availability";
ALTER TABLE "new_Availability" RENAME TO "Availability";
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tailorId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "requestedDeliveryDate" DATETIME NOT NULL,
    "actualDeliveryDate" DATETIME,
    "description" TEXT,
    "measurements" JSONB,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_tailorId_fkey" FOREIGN KEY ("tailorId") REFERENCES "Tailor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "id", "status", "tailorId", "updatedAt", "userId") SELECT "createdAt", "id", "status", "tailorId", "updatedAt", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
