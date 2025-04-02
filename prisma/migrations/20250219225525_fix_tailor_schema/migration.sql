/*
  Warnings:

  - You are about to drop the column `availabilityStatus` on the `Tailor` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tailor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialty" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "availability" TEXT DEFAULT 'OPEN',
    "maxDailyBookings" INTEGER NOT NULL DEFAULT 5,
    "bookingNoticePeriod" TEXT NOT NULL DEFAULT '1 week',
    "unavailableDates" JSONB,
    "completionRate" REAL NOT NULL DEFAULT 0.0,
    "averageRating" REAL NOT NULL DEFAULT 0.0,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "onTimeDeliveries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tailor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tailor" ("address", "averageRating", "bio", "bookingNoticePeriod", "completionRate", "createdAt", "id", "latitude", "location", "longitude", "maxDailyBookings", "onTimeDeliveries", "specialty", "totalProjects", "unavailableDates", "updatedAt", "userId") SELECT "address", "averageRating", "bio", "bookingNoticePeriod", "completionRate", "createdAt", "id", "latitude", "location", "longitude", "maxDailyBookings", "onTimeDeliveries", "specialty", "totalProjects", "unavailableDates", "updatedAt", "userId" FROM "Tailor";
DROP TABLE "Tailor";
ALTER TABLE "new_Tailor" RENAME TO "Tailor";
CREATE UNIQUE INDEX "Tailor_userId_key" ON "Tailor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
