import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCharacterQuestions } from '../../../../utils/questionGenerator';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: any
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

    // Find next available character position
    const assignedPositions = gameRoom.students.map((s: { charPosition: unknown; }) => s.charPosition);
    let nextPosition = 0;
    while (assignedPositions.includes(nextPosition) && nextPosition < gameRoom.answerString.length) {
      nextPosition++;
    }

    if (nextPosition >= gameRoom.answerString.length) {
      return NextResponse.json(
        { error: 'No available character positions' },
        { status: 400 }
      );
    }

    // Get the character this student needs to solve
    const assignedChar = gameRoom.answerString[nextPosition];
    const ascii = assignedChar.charCodeAt(0);
    const targetBits = ascii.toString(2).padStart(8, '0');
    
    // Generate character-based questions
    const questions = generateCharacterQuestions(assignedChar);

    const student = await prisma.student.create({
      data: {
        gameRoomId: gameRoom.id,
        displayName: displayName.trim(),
        assignedChar: assignedChar,
        charPosition: nextPosition,
        targetBits: targetBits,
        currentBits: targetBits, // Initially same as targetBits
        questions: JSON.stringify(questions),
        isCompleted: false,
      },
    });

    
    for (const question of questions) {
      // @ts-ignore
      question.correctAnswer = -1;
    }

    return NextResponse.json({
      studentId: student.id,
      // assignedChar: assignedChar,
      charPosition: nextPosition,
      // targetBits: targetBits,
      questions,
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