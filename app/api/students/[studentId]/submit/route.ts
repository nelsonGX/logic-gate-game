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
    let reconstructedBits = '';
    
    if (allCorrect) {
      // Reconstruct the 8-bit character from individual question answers
      // Questions are in order: Alpha (3 bits), Beta (3 bits), Gamma (2 bits)
      
      // Alpha group (bits 0-2)
      for (let i = 0; i < 3; i++) {
        const questionIndex = i; // Questions 0, 1, 2
        const answer = answers[questionIndex];
        reconstructedBits += answer.toString();
      }
      
      // Beta group (bits 3-5) 
      for (let i = 0; i < 3; i++) {
        const questionIndex = 3 + i; // Questions 3, 4, 5
        const answer = answers[questionIndex];
        reconstructedBits += answer.toString();
      }
      
      // Gamma group (bits 6-7)
      for (let i = 0; i < 2; i++) {
        const questionIndex = 6 + i; // Questions 6, 7
        const answer = answers[questionIndex];
        reconstructedBits += answer.toString();
      }
      
      // Convert reconstructed bits to character
      const reconstructedAscii = parseInt(reconstructedBits, 2);
      const reconstructedChar = String.fromCharCode(reconstructedAscii);
      
      // Only unlock if the reconstructed character matches the target
      if (reconstructedChar === student.assignedChar) {
        solvedChar = student.assignedChar;
      }
    }

    // Update student record
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        answers: JSON.stringify(answers),
        solvedChar: solvedChar,
        isCompleted: solvedChar !== null,
        completedAt: solvedChar !== null ? new Date() : null,
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
      reconstructedBits: reconstructedBits || 'N/A',
      targetBits: student.targetBits,
      results,
      message: solvedChar ? `Character '${student.assignedChar}' unlocked!` : allCorrect ? 'All correct but character mismatch!' : 'Some answers incorrect. Try again.',
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Failed to submit answers' },
      { status: 500 }
    );
  }
}