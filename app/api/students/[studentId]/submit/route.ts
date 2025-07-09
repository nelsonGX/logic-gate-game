import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { rollNewBitsForGroup, generateCharacterQuestions } from '../../../../utils/questionGenerator';

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

    // Get current retry counts and completion status
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!currentStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Prepare update data for the specific group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    
    // Check if this is the second wrong attempt for this group
    const currentRetries = groupName === 'alpha' ? currentStudent.alphaRetries : 
                          groupName === 'beta' ? currentStudent.betaRetries : 
                          currentStudent.gammaRetries;
    
    const shouldRollBits = !allCorrect && currentRetries >= 1;
    
          if (groupName === 'alpha') {
        updateData.alphaAnswers = JSON.stringify(answers);
        updateData.alphaCompleted = allCorrect;
        if (!allCorrect && currentRetries < 1) {
          updateData.alphaRetries = currentRetries + 1;
        } else {
          updateData.alphaRetries = 0;
        }
      } else if (groupName === 'beta') {
        updateData.betaAnswers = JSON.stringify(answers);
        updateData.betaCompleted = allCorrect;
        if (!allCorrect && currentRetries < 1) {
          updateData.betaRetries = currentRetries + 1;
        } else {
          updateData.betaRetries = 0;
        }
      } else if (groupName === 'gamma') {
        updateData.gammaAnswers = JSON.stringify(answers);
        updateData.gammaCompleted = allCorrect;
        if (!allCorrect && currentRetries < 1) {
          updateData.gammaRetries = currentRetries + 1;
        } else {
          updateData.gammaRetries = 0;
        }
      }

    // Handle bit rolling for incorrect groups after second attempt
    if (shouldRollBits) {
      console.log('=== BIT ROLLING DEBUG ===');
      console.log('Group:', groupName);
      console.log('Current retries:', currentRetries);
      console.log('Should roll bits:', shouldRollBits);
      console.log('Current bits before rolling:', currentStudent.currentBits);
      
      const correctGroups = {
        alpha: currentStudent.alphaCompleted,
        beta: currentStudent.betaCompleted,
        gamma: currentStudent.gammaCompleted
      };

      console.log('Correct groups:', correctGroups);

      // Roll new bits for the incorrect group
      const { newBits, newChar } = rollNewBitsForGroup(
        currentStudent.currentBits,
        groupName as 'alpha' | 'beta' | 'gamma',
        correctGroups
      );

      console.log('New bits after rolling:', newBits);
      console.log('New character:', newChar);
      console.log('Bits changed:', currentStudent.currentBits !== newBits);
      console.log('=== END DEBUG ===');

      // Regenerate questions for the group
      const updatedQuestions = generateCharacterQuestions(newChar);

      // Update the student with new bits and questions
      updateData.assignedChar = newChar;
      updateData.currentBits = updateData.targetBits = newBits;
      updateData.questions = JSON.stringify(updatedQuestions);
      
      // Reset answers for the rolled group
      if (groupName === 'alpha') {
        updateData.alphaAnswers = null;
      } else if (groupName === 'beta') {
        updateData.betaAnswers = null;
      } else if (groupName === 'gamma') {
        updateData.gammaAnswers = null;
      }
    }
    
    // Check if all groups will be completed after this submission
    const alphaWillBeComplete = groupName === 'alpha' ? allCorrect : currentStudent.alphaCompleted;
    const betaWillBeComplete = groupName === 'beta' ? allCorrect : currentStudent.betaCompleted;
    const gammaWillBeComplete = groupName === 'gamma' ? allCorrect : currentStudent.gammaCompleted;
    
    const allGroupsComplete = alphaWillBeComplete && betaWillBeComplete && gammaWillBeComplete;
    
    if (allGroupsComplete) {
      // Use the current bits to determine the solved character
      const solvedCharCode = parseInt(currentStudent.currentBits, 2);
      const solvedChar = String.fromCharCode(solvedCharCode);
      updateData.solvedChar = solvedChar;
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    // Update student record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    console.log('Data:', {
      success: true,
      group: group,
      correct: allCorrect,
      groupCompleted: allCorrect,
      allGroupsCompleted: allGroupsComplete,
      characterUnlocked: allGroupsComplete,
      bitsRolled: shouldRollBits,
      message: allCorrect ? `${group} group completed!` : 
               shouldRollBits ? `${group} group incorrect. New bits have been rolled for this group.` :
               `${group} group incorrect. Try again.`,
    });

    return NextResponse.json({
      success: true,
      group: group,
      correct: allCorrect,
      groupCompleted: allCorrect,
      allGroupsCompleted: allGroupsComplete,
      characterUnlocked: allGroupsComplete,
      bitsRolled: shouldRollBits,
      message: allCorrect ? `${group} group completed!` : 
               shouldRollBits ? `${group} group incorrect. New bits have been rolled for this group.` :
               `${group} group incorrect. Try again.`,
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Failed to submit answers' },
      { status: 500 }
    );
  }
}