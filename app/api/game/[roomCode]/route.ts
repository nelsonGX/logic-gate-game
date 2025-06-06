import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
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

    return NextResponse.json(gameRoom);

  } catch (error) {
    console.error('Error fetching game room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game room' },
      { status: 500 }
    );
  }
}