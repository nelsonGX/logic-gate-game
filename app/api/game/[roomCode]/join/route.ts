import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const awaitedParams = await params;
    const { roomCode } = awaitedParams;
    const { displayName } = await request.json();

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    const gameRoom = await prisma.gameRoom.findUnique({
      where: { roomCode },
      include: { students: true },
    });

    if (!gameRoom) {
      return NextResponse.json(
        { error: 'Game room not found' },
        { status: 404 }
      );
    }

    if (gameRoom.students.length >= gameRoom.studentAmount) {
      return NextResponse.json(
        { error: 'Game room is full' },
        { status: 400 }
      );
    }

    // Find next available bit position
    const assignedBits = gameRoom.students.map(s => {
      try {
        return JSON.parse(s.assignedBits);
      } catch {
        return [];
      }
    }).flat();

    let nextBit = 0;
    while (assignedBits.includes(nextBit) && nextBit < gameRoom.studentAmount) {
      nextBit++;
    }

    if (nextBit >= gameRoom.studentAmount) {
      return NextResponse.json(
        { error: 'No available bit positions' },
        { status: 400 }
      );
    }

    // Generate basic puzzle data (for now, just AND gate with target bit)
    const targetBit = gameRoom.answerString[nextBit] === '1';
    const puzzleData = {
      targetBit,
      bitPosition: nextBit,
      inputs: [false, false],
      gates: [],
    };

    const student = await prisma.student.create({
      data: {
        gameRoomId: gameRoom.id,
        displayName: displayName.trim(),
        assignedBits: JSON.stringify([nextBit]),
        puzzleData: JSON.stringify(puzzleData),
        isCompleted: false,
      },
    });

    return NextResponse.json({
      studentId: student.id,
      assignedBit: nextBit,
      targetBit,
      message: 'Successfully joined the game',
    });

  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}