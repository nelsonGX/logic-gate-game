-- CreateTable
CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomCode" TEXT NOT NULL,
    "team" INTEGER NOT NULL,
    "studentAmount" INTEGER NOT NULL,
    "answerString" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameRoomId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "assignedBits" TEXT NOT NULL,
    "solvedBits" TEXT,
    "questions" TEXT NOT NULL,
    "answers" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "Student_gameRoomId_fkey" FOREIGN KEY ("gameRoomId") REFERENCES "GameRoom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_roomCode_key" ON "GameRoom"("roomCode");
