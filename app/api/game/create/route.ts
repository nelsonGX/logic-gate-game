import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateAnswerString(): string {
  return Math.random().toString(2).substring(2, 10).padEnd(8, '0');
}

export async function POST(request: NextRequest) {
  try {
    const { teamNumber, numStudents } = await request.json();

    if (!teamNumber || !numStudents || numStudents < 1 || numStudents > 10) {
      return NextResponse.json(
        { error: 'Invalid team number or student count' },
        { status: 400 }
      );
    }

    const roomCode = generateRoomCode();
    const answerString = generateAnswerString();

    const gameRoom = await prisma.gameRoom.create({
      data: {
        roomCode,
        team: teamNumber,
        studentAmount: numStudents,
        answerString,
        status: 'waiting',
      },
    });

    return NextResponse.json({
      roomCode: gameRoom.roomCode,
      gameRoomId: gameRoom.id,
    });

  } catch (error) {
    console.error('Error creating game room:', error);
    return NextResponse.json(
      { error: 'Failed to create game room' },
      { status: 500 }
    );
  }
}