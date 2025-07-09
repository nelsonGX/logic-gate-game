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
      include: {
        students: true,
      },
    });

    if (!gameRoom) {
      return NextResponse.json(
        { error: 'Game room not found' },
        { status: 404 }
      );
    }

    if (gameRoom.status !== 'active') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      );
    }

    // Update game room status to expired
    const updatedGameRoom = await prisma.gameRoom.update({
      where: {
        roomCode: roomCode,
      },
      data: {
        status: 'expired',
      },
    });

    return NextResponse.json({
      message: 'Game expired successfully',
      gameRoom: updatedGameRoom,
    });

  } catch (error) {
    console.error('Error expiring game:', error);
    return NextResponse.json(
      { error: 'Failed to expire game' },
      { status: 500 }
    );
  }
} 