-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Novel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "pdfUrl" TEXT,
    "pendingCoverUrl" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOVEL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "serializationStatus" TEXT NOT NULL DEFAULT 'SERIALIZING',
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "lastSubmittedAt" DATETIME,
    "lastApprovedAt" DATETIME,
    "changeLog" TEXT,
    "aiReviewPassed" BOOLEAN,
    "aiQuality" INTEGER,
    "aiReviewedAt" DATETIME,
    "aiReviewRaw" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uploaderId" TEXT,
    "journalId" TEXT,
    CONSTRAINT "Novel_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Novel_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Novel" ("aiQuality", "aiReviewPassed", "aiReviewRaw", "aiReviewedAt", "author", "category", "changeLog", "coverUrl", "createdAt", "description", "id", "isRecommended", "lastApprovedAt", "lastSubmittedAt", "pendingCoverUrl", "rating", "serializationStatus", "status", "title", "type", "updatedAt", "uploaderId", "views") SELECT "aiQuality", "aiReviewPassed", "aiReviewRaw", "aiReviewedAt", "author", "category", "changeLog", "coverUrl", "createdAt", "description", "id", "isRecommended", "lastApprovedAt", "lastSubmittedAt", "pendingCoverUrl", "rating", "serializationStatus", "status", "title", "type", "updatedAt", "uploaderId", "views" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managedJournalId" TEXT,
    CONSTRAINT "User_managedJournalId_fkey" FOREIGN KEY ("managedJournalId") REFERENCES "Journal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "status", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
