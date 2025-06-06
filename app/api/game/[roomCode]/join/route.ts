import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCharacterQuestions(character: string, charPosition: number): any[] {
  // Convert character to 8-bit ASCII
  const ascii = character.charCodeAt(0);
  const binaryString = ascii.toString(2).padStart(8, '0');
  
  // Split into 3-3-2 bits
  const firstGroup = binaryString.substring(0, 3);  // bits 0-2
  const secondGroup = binaryString.substring(3, 6); // bits 3-5
  const thirdGroup = binaryString.substring(6, 8);  // bits 6-7
  
  const gateTypes = ['AND', 'OR', 'NOT', 'XOR'];
  const complexGateTypes = ['NAND', 'NOR', 'XOR'];
  
  function calculateGateOutput(gateType: string, inputs: boolean[]): boolean {
    switch (gateType) {
      case 'AND': return inputs[0] && inputs[1];
      case 'OR': return inputs[0] || inputs[1];
      case 'NOT': return !inputs[0];
      case 'XOR': return inputs[0] !== inputs[1];
      case 'NAND': return !(inputs[0] && inputs[1]);
      case 'NOR': return !(inputs[0] || inputs[1]);
      default: return false;
    }
  }
  
  function findInputsForTarget(gateType: string, targetOutput: boolean): boolean[] {
    if (gateType === 'NOT') {
      return [!targetOutput];
    }
    
    const allCombinations = [
      [false, false],
      [false, true],
      [true, false],
      [true, true]
    ];
    
    const validCombinations = allCombinations.filter(inputs => 
      calculateGateOutput(gateType, inputs) === targetOutput
    );
    
    return validCombinations[Math.floor(Math.random() * validCombinations.length)];
  }
  
  function generateSimpleQuestion(bitGroup: string, groupName: string): any {
    // Generate one question that determines all 3 bits of this group
    const targetBinary = parseInt(bitGroup, 2);
    const gateType = gateTypes[Math.floor(Math.random() * gateTypes.length)];
    
    // For simplicity, we'll make the question determine if the group value is > 3 (middle value)
    const targetOutput = targetBinary > 3;
    const inputs = findInputsForTarget(gateType, targetOutput);
    
    return {
      id: `group_${groupName}`,
      type: 'simple_logic_gate',
      text: `${groupName} Circuit: What is the output of this ${gateType} gate?`,
      gateType,
      inputs,
      options: ['0 (False)', '1 (True)'],
      correctAnswer: targetOutput ? 1 : 0,
      explanation: `${gateType} gate outputs ${targetOutput ? '1' : '0'}`,
      targetBits: bitGroup,
      bitGroup: groupName
    };
  }
  
  function generateComplexQuestion(bitGroup: string): any {
    // Generate a complex multi-gate question for the 2-bit group
    const bit1 = bitGroup[0] === '1';
    const bit2 = bitGroup[1] === '1';
    
    // Create a 2-gate circuit: Gate1 -> Gate2 -> Output
    const gate1Type = complexGateTypes[Math.floor(Math.random() * complexGateTypes.length)];
    const gate2Type = complexGateTypes[Math.floor(Math.random() * complexGateTypes.length)];
    
    // Generate inputs for gate1 that will produce bit1
    const gate1Inputs = findInputsForTarget(gate1Type, bit1);
    
    // Generate second input for gate2, gate2 takes output of gate1 + this input to produce bit2
    const gate2SecondInput = Math.random() < 0.5;
    
    // Check if this combination works
    const gate1Output = calculateGateOutput(gate1Type, gate1Inputs);
    const gate2Output = calculateGateOutput(gate2Type, [gate1Output, gate2SecondInput]);
    
    // If it doesn't match bit2, flip the second input
    const finalGate2Input = gate2Output === bit2 ? gate2SecondInput : !gate2SecondInput;
    
    return {
      id: 'complex_final',
      type: 'complex_logic_gate',
      text: `FINAL CHALLENGE: Calculate the output of this complex circuit`,
      circuit: {
        gate1: { type: gate1Type, inputs: gate1Inputs },
        gate2: { type: gate2Type, inputs: [null, finalGate2Input] } // null will be filled with gate1 output
      },
      options: ['0 (False)', '1 (True)'],
      correctAnswer: bit2 ? 1 : 0,
      explanation: `Complex circuit outputs ${bit2 ? '1' : '0'}`,
      targetBits: bitGroup,
      isComplex: true,
      isFinal: true
    };
  }
  
  const questions = [];
  
  // Generate simple questions for first two groups (3 bits each)
  questions.push(generateSimpleQuestion(firstGroup, 'Alpha'));
  questions.push(generateSimpleQuestion(secondGroup, 'Beta'));
  
  // Generate complex question for final group (2 bits)
  questions.push(generateComplexQuestion(thirdGroup));
  
  return questions;
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

    // Find next available character position
    const assignedPositions = gameRoom.students.map(s => s.charPosition);
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
    const questions = generateCharacterQuestions(assignedChar, nextPosition);

    const student = await prisma.student.create({
      data: {
        gameRoomId: gameRoom.id,
        displayName: displayName.trim(),
        assignedChar: assignedChar,
        charPosition: nextPosition,
        targetBits: targetBits,
        questions: JSON.stringify(questions),
        isCompleted: false,
      },
    });

    return NextResponse.json({
      studentId: student.id,
      assignedChar: assignedChar,
      charPosition: nextPosition,
      targetBits: targetBits,
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