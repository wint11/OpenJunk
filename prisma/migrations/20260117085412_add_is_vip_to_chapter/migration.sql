-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "novelId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewLog_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GhostMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "author" TEXT DEFAULT 'ANONYMOUS',
    "type" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "novelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isModified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("content", "createdAt", "id", "novelId", "order", "title", "updatedAt") SELECT "content", "createdAt", "id", "novelId", "order", "title", "updatedAt" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE INDEX "Chapter_novelId_idx" ON "Chapter"("novelId");
CREATE TABLE "new_Novel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
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
    CONSTRAINT "Novel_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Novel" ("aiQuality", "aiReviewPassed", "aiReviewRaw", "aiReviewedAt", "author", "category", "coverUrl", "createdAt", "description", "id", "pendingCoverUrl", "rating", "serializationStatus", "status", "title", "type", "updatedAt", "uploaderId", "views") SELECT "aiQuality", "aiReviewPassed", "aiReviewRaw", "aiReviewedAt", "author", "category", "coverUrl", "createdAt", "description", "id", "pendingCoverUrl", "rating", "serializationStatus", "status", "title", "type", "updatedAt", "uploaderId", "views" FROM "Novel";
DROP TABLE "Novel";
ALTER TABLE "new_Novel" RENAME TO "Novel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
