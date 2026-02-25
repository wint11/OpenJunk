-- AlterTable
ALTER TABLE "Novel" ADD COLUMN "uploaderIp" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "senderId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_JournalReviewers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_JournalReviewers_A_fkey" FOREIGN KEY ("A") REFERENCES "Journal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_JournalReviewers_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_JournalReviewers_AB_unique" ON "_JournalReviewers"("A", "B");

-- CreateIndex
CREATE INDEX "_JournalReviewers_B_index" ON "_JournalReviewers"("B");
