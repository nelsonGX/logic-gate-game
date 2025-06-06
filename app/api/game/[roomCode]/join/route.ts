import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateQuestionsForBit(bitPosition: number, targetBit: boolean): any[] {
  const questionPools = [
    // Math/Logic Questions
    {
      text: "What is the result of the binary operation 1010 AND 1100?",
      options: ["1000", "1110", "0010", "1111"],
      correctAnswer: 0,
      explanation: "Binary AND: 1010 & 1100 = 1000 (only positions where both bits are 1)"
    },
    {
      text: "If you have a 3-bit binary number, what's the maximum decimal value?",
      options: ["6", "7", "8", "9"],
      correctAnswer: 1,
      explanation: "3 bits can represent 2³ = 8 values (0-7), so maximum is 7"
    },
    {
      text: "What does the hexadecimal value F represent in decimal?",
      options: ["14", "15", "16", "17"],
      correctAnswer: 1,
      explanation: "Hex F = decimal 15"
    },
    
    // Cipher/Code Questions
    {
      text: "In a Caesar cipher with shift 3, what does 'DEF' encode to?",
      options: ["GHI", "ABC", "JKL", "MNO"],
      correctAnswer: 0,
      explanation: "Each letter shifts forward 3 positions: D→G, E→H, F→I"
    },
    {
      text: "What number comes next in the sequence: 2, 4, 8, 16, ?",
      options: ["24", "32", "20", "18"],
      correctAnswer: 1,
      explanation: "Each number doubles: 2×2=4, 4×2=8, 8×2=16, 16×2=32"
    },
    {
      text: "If A=1, B=2, C=3... what does 'CODE' sum to?",
      options: ["31", "32", "33", "34"],
      correctAnswer: 0,
      explanation: "C(3) + O(15) + D(4) + E(5) = 27, but using 0-indexing: C(2) + O(14) + D(3) + E(4) = 23"
    },
    
    // Pattern Recognition
    {
      text: "Which pattern completes the sequence: ○●○●○?",
      options: ["○", "●", "◯", "◉"],
      correctAnswer: 1,
      explanation: "Alternating pattern: circle, filled circle, circle, filled circle, circle, [filled circle]"
    },
    {
      text: "In binary, what's the next number after 101?",
      options: ["110", "111", "100", "102"],
      correctAnswer: 0,
      explanation: "Binary 101 = decimal 5, next is 6 = binary 110"
    },
    {
      text: "What's the missing piece in: 1, 1, 2, 3, 5, ?",
      options: ["7", "8", "9", "10"],
      correctAnswer: 1,
      explanation: "Fibonacci sequence: each number is sum of previous two (3+5=8)"
    }
  ];

  // Select 3-5 random questions
  const selectedQuestions = [];
  const questionCount = 3 + Math.floor(Math.random() * 3); // 3-5 questions
  const usedIndexes = new Set();
  
  for (let i = 0; i < questionCount; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * questionPools.length);
    } while (usedIndexes.has(randomIndex));
    
    usedIndexes.add(randomIndex);
    selectedQuestions.push({
      id: `q${i + 1}`,
      ...questionPools[randomIndex]
    });
  }
  
  // Add one trick question that determines the bit value
  const trickQuestion = {
    id: 'final',
    text: `To unlock this section, choose the ${targetBit ? 'TRUE' : 'FALSE'} statement:`,
    options: [
      targetBit ? "This door requires a digital key" : "This door opens manually",
      targetBit ? "Security protocols are active" : "Security is disabled", 
      targetBit ? "Power circuits are energized" : "All systems are offline",
      "None of the above"
    ],
    correctAnswer: targetBit ? Math.floor(Math.random() * 3) : 3,
    explanation: `Your bit position ${bitPosition} needs to be ${targetBit ? '1' : '0'} for the escape sequence.`
  };
  
  selectedQuestions.push(trickQuestion);
  return selectedQuestions;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomCode: string } }
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

    // Find next available bit position
    const assignedBits = gameRoom.students.map(s => {
      try {
        return JSON.parse(s.assignedBits);
      } catch {
        return [];
      }
    }).flat();

    let nextBit = 0;
    while (assignedBits.includes(nextBit) && nextBit < gameRoom.studentAmount) {
      nextBit++;
    }

    if (nextBit >= gameRoom.studentAmount) {
      return NextResponse.json(
        { error: 'No available bit positions' },
        { status: 400 }
      );
    }

    // Generate questions for the student
    const targetBit = gameRoom.answerString[nextBit] === '1';
    const questions = generateQuestionsForBit(nextBit, targetBit);

    const student = await prisma.student.create({
      data: {
        gameRoomId: gameRoom.id,
        displayName: displayName.trim(),
        assignedBits: JSON.stringify([nextBit]),
        questions: JSON.stringify(questions),
        isCompleted: false,
      },
    });

    return NextResponse.json({
      studentId: student.id,
      assignedBit: nextBit,
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