import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    const awaitedParams = await params;
    const { studentId } = awaitedParams;
    const { group, answers } = await request.json();

    if (!group || !['alpha', 'beta', 'gamma'].includes(group.toLowerCase())) {
      return NextResponse.json(
        { error: 'Valid group (alpha, beta, gamma) is required' },
        { status: 400 }
      );
    }

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

    const groupName = group.toLowerCase();
    
    // Filter questions for the specific group
    const groupQuestions = questions.filter((q: { bitGroup: string; }) => 
      q.bitGroup.toLowerCase() === groupName
    );
    
    if (answers.length !== groupQuestions.length) {
      return NextResponse.json(
        { error: `Expected ${groupQuestions.length} answers for ${group} group` },
        { status: 400 }
      );
    }

    // Check if all group questions are answered correctly
    let allCorrect = true;
    for (let i = 0; i < groupQuestions.length; i++) {
      const question = groupQuestions[i];
      const answer = answers[i];
      if (answer !== question.correctAnswer) {
        allCorrect = false;
        break;
      }
    }

    // Prepare update data for the specific group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    
    if (groupName === 'alpha') {
      updateData.alphaAnswers = JSON.stringify(answers);
      updateData.alphaCompleted = allCorrect;
    } else if (groupName === 'beta') {
      updateData.betaAnswers = JSON.stringify(answers);
      updateData.betaCompleted = allCorrect;
    } else if (groupName === 'gamma') {
      updateData.gammaAnswers = JSON.stringify(answers);
      updateData.gammaCompleted = allCorrect;
    }
    
    // Check if all groups will be completed after this submission
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    const alphaWillBeComplete = groupName === 'alpha' ? allCorrect : currentStudent?.alphaCompleted;
    const betaWillBeComplete = groupName === 'beta' ? allCorrect : currentStudent?.betaCompleted;
    const gammaWillBeComplete = groupName === 'gamma' ? allCorrect : currentStudent?.gammaCompleted;
    
    const allGroupsComplete = alphaWillBeComplete && betaWillBeComplete && gammaWillBeComplete;
    
    if (allGroupsComplete) {
      updateData.solvedChar = student.assignedChar;
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    // Update student record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      group: group,
      correct: allCorrect,
      groupCompleted: allCorrect,
      allGroupsCompleted: allGroupsComplete,
      characterUnlocked: allGroupsComplete,
      message: allCorrect ? `${group} group completed!` : `${group} group incorrect. Try again.`,
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Failed to submit answers' },
      { status: 500 }
    );
  }
}