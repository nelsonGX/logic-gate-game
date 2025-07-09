import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const awaitedParams = await params;
    const { studentId } = awaitedParams;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        gameRoom: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: student.id,
      displayName: student.displayName,
      //assignedChar: student.assignedChar,
      charPosition: student.charPosition,
      //targetBits: student.targetBits,
      // currentBits: student.currentBits,
      questions: typeof student.questions === 'string' ? JSON.parse(student.questions) : student.questions,
      alphaRetries: student.alphaRetries,
      betaRetries: student.betaRetries,
      gammaRetries: student.gammaRetries,
      alphaCompleted: student.alphaCompleted,
      betaCompleted: student.betaCompleted,
      gammaCompleted: student.gammaCompleted,
      alphaAnswers: student.alphaAnswers,
      betaAnswers: student.betaAnswers,
      gammaAnswers: student.gammaAnswers,
      allGroupsCompleted: student.alphaCompleted && student.betaCompleted && student.gammaCompleted,
      // solvedChar: student.solvedChar,
      completedAt: student.completedAt,
      gameRoom: {
        id: student.gameRoom.id,
        roomCode: student.gameRoom.roomCode,
        status: student.gameRoom.status,
        answerString: student.gameRoom.answerString
      }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}