import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const awaitedParams = await params;
    const { studentId } = awaitedParams;
    const { answers } = await request.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers array is required' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { gameRoom: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Parse the questions to validate answers
    let questions;
    try {
      questions = JSON.parse(student.questions);
    } catch {
      return NextResponse.json(
        { error: 'Invalid question data' },
        { status: 500 }
      );
    }

    // Check if all questions are answered correctly
    let allCorrect = true;
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[i];
      const isCorrect = answer === question.correctAnswer;
      
      results.push({
        questionId: question.id,
        selectedAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });

      if (!isCorrect) {
        allCorrect = false;
      }
    }

    // Calculate the solved character based on performance
    // Student must answer ALL questions correctly to unlock their character
    let solvedChar: string | null = null;
    if (allCorrect) {
      // If all answers are correct, the student has successfully solved their character
      solvedChar = student.assignedChar;
    }

    // Update student record
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        answers: JSON.stringify(answers),
        solvedChar: solvedChar,
        isCompleted: allCorrect,
        completedAt: allCorrect ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      allCorrect,
      score: results.filter(r => r.isCorrect).length,
      totalQuestions: questions.length,
      solvedChar,
      assignedChar: student.assignedChar,
      charPosition: student.charPosition,
      results,
      message: allCorrect ? `Character '${student.assignedChar}' unlocked!` : 'Some answers incorrect. Try again.',
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Failed to submit answers' },
      { status: 500 }
    );
  }
}