import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    const awaitedParams = await params;
    const { roomCode } = awaitedParams;

    const gameRoom = await prisma.gameRoom.findUnique({
      where: {
        roomCode: roomCode,
      },
    });

    if (!gameRoom) {
      return NextResponse.json(
        { error: 'Game room not found' },
        { status: 404 }
      );
    }

    if (gameRoom.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game is not in waiting state' },
        { status: 400 }
      );
    }

    const updatedGameRoom = await prisma.gameRoom.update({
      where: {
        roomCode: roomCode,
      },
      data: {
        status: 'active',
      },
    });

    return NextResponse.json(updatedGameRoom);

  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
}