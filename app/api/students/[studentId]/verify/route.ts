import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    const awaitedParams = await params;
    const { answer } = await request.json();

    const studentId = awaitedParams.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        gameRoom: true,
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.assignedChar !== answer) {
      return NextResponse.json({ error: 'Wrong answer' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Correct answer'
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}