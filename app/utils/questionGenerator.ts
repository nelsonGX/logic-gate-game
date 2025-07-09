import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function generateCharacterQuestions(character: string): unknown[] {
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
  
  function generateSimpleQuestion(bitGroup: string, groupName: string): unknown[] {
    // Generate one question for each bit in the group (3 bits = 3 questions)
    const questions = [];
    
    for (let i = 0; i < bitGroup.length; i++) {
      const bit = bitGroup[i] === '1';
      const gateType = gateTypes[Math.floor(Math.random() * gateTypes.length)];
      const inputs = findInputsForTarget(gateType, bit);
      
      questions.push({
        id: `${groupName.toLowerCase()}_bit_${i}`,
        type: 'simple_logic_gate',
        text: `${groupName} 字元 ${i + 1}：這個 ${gateType} 閘的輸出是什麼？`,
        gateType,
        inputs,
        options: ['0 (False)', '1 (True)'],
        correctAnswer: bit ? 1 : 0,
        explanation: `${gateType} gate outputs ${bit ? '1' : '0'}`,
        targetBit: bit,
        bitGroup: groupName,
        bitIndex: i
      });
    }
    
    return questions;
  }
  
  function generateComplexQuestion(bitGroup: string): unknown[] {
    // Generate one question for each bit in the 2-bit group using complex circuits
    const questions = [];
    
    for (let i = 0; i < bitGroup.length; i++) {
      const bit = bitGroup[i] === '1';
      
      // Create a 2-gate circuit: Gate1 -> Gate2 -> Output
      const gate1Type = complexGateTypes[Math.floor(Math.random() * complexGateTypes.length)];
      const gate2Type = gateTypes[Math.floor(Math.random() * gateTypes.length)];
      
      // Generate inputs for gate1
      const gate1Inputs = [Math.random() < 0.5, Math.random() < 0.5];
      const gate1Output = calculateGateOutput(gate1Type, gate1Inputs);
      
      // Generate second input for gate2 to produce the target bit
      const gate2SecondInput = Math.random() < 0.5;
      const testOutput = calculateGateOutput(gate2Type, [gate1Output, gate2SecondInput]);
      const finalGate2Input = testOutput === bit ? gate2SecondInput : !gate2SecondInput;
      
      questions.push({
        id: `gamma_bit_${i}`,
        type: 'complex_logic_gate',
        text: `Gamma 字元 ${i + 1}：計算複合電路的最終輸出`,
        circuit: {
          gate1: { type: gate1Type, inputs: gate1Inputs },
          gate2: { type: gate2Type, inputs: [null, finalGate2Input] } // null will be filled with gate1 output
        },
        options: ['0 (False)', '1 (True)'],
        correctAnswer: bit ? 1 : 0,
        explanation: `Complex circuit outputs ${bit ? '1' : '0'}`,
        targetBit: bit,
        bitGroup: 'Gamma',
        bitIndex: i,
        isComplex: true,
        isFinal: i === bitGroup.length - 1
      });
    }
    
    return questions;
  }
  
  const questions = [];
  
  // Generate simple questions for first two groups (3 bits each)
  questions.push(...generateSimpleQuestion(firstGroup, 'Alpha'));
  questions.push(...generateSimpleQuestion(secondGroup, 'Beta'));
  
  // Generate complex questions for final group (2 bits)
  questions.push(...generateComplexQuestion(thirdGroup));
  
  return questions;
}

// Function to generate a random character in A-Z range
export function generateRandomCharacter(): string {
  const charCode = Math.floor(Math.random() * 26) + 65; // 65-90 for A-Z
  return String.fromCharCode(charCode);
}

// Function to roll new bits for a specific group while keeping others unchanged
export function rollNewBitsForGroup(
  currentBits: string, 
  group: 'alpha' | 'beta' | 'gamma', 
  correctGroups: { alpha: boolean, beta: boolean, gamma: boolean }
): { newBits: string, newChar: string } {
  // Generate a new random character
  const newChar = generateRandomCharacter();
  const newCharBits = newChar.charCodeAt(0).toString(2).padStart(8, '0');
  
  // Split current bits into groups
  const alphaBits = currentBits.substring(0, 3);
  const betaBits = currentBits.substring(3, 6);
  const gammaBits = currentBits.substring(6, 8);
  
  // Split new character bits into groups
  const newAlphaBits = newCharBits.substring(0, 3);
  const newBetaBits = newCharBits.substring(3, 6);
  const newGammaBits = newCharBits.substring(6, 8);
  
  // Roll all non-correct groups, keep correct groups unchanged
  const newAlphaBitsFinal = correctGroups.alpha ? alphaBits : newAlphaBits;
  const newBetaBitsFinal = correctGroups.beta ? betaBits : newBetaBits;
  const newGammaBitsFinal = correctGroups.gamma ? gammaBits : newGammaBits;
  
  const finalBits = newAlphaBitsFinal + newBetaBitsFinal + newGammaBitsFinal;
  
  return { newBits: finalBits, newChar };
}

// Function to regenerate questions for a specific group
export function regenerateQuestionsForGroup(
  currentQuestions: unknown[], 
  group: 'alpha' | 'beta' | 'gamma', 
  newBits: string
): unknown[] {
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
  
  function generateSimpleQuestion(bitGroup: string, groupName: string): unknown[] {
    const questions = [];
    
    for (let i = 0; i < bitGroup.length; i++) {
      const bit = bitGroup[i] === '1';
      const gateType = gateTypes[Math.floor(Math.random() * gateTypes.length)];
      const inputs = findInputsForTarget(gateType, bit);
      
      questions.push({
        id: `${groupName.toLowerCase()}_bit_${i}`,
        type: 'simple_logic_gate',
        text: `${groupName} 字元 ${i + 1}：這個 ${gateType} 閘的輸出是什麼？`,
        gateType,
        inputs,
        options: ['0 (False)', '1 (True)'],
        correctAnswer: bit ? 1 : 0,
        explanation: `${gateType} gate outputs ${bit ? '1' : '0'}`,
        targetBit: bit,
        bitGroup: groupName,
        bitIndex: i
      });
    }
    
    return questions;
  }
  
  function generateComplexQuestion(bitGroup: string): unknown[] {
    const questions = [];
    
    for (let i = 0; i < bitGroup.length; i++) {
      const bit = bitGroup[i] === '1';
      
      const gate1Type = complexGateTypes[Math.floor(Math.random() * complexGateTypes.length)];
      const gate2Type = gateTypes[Math.floor(Math.random() * gateTypes.length)];
      
      const gate1Inputs = [Math.random() < 0.5, Math.random() < 0.5];
      const gate1Output = calculateGateOutput(gate1Type, gate1Inputs);
      
      let gate2SecondInput = null;

      if (gate2Type === 'NOT') {
         gate2SecondInput = null;
      } else {
        gate2SecondInput = Math.random() < 0.5;
        const testOutput = calculateGateOutput(gate2Type, [gate1Output, gate2SecondInput]);
        gate2SecondInput = testOutput === bit ? gate2SecondInput : !gate2SecondInput;
      }

      
      questions.push({
        id: `gamma_bit_${i}`,
        type: 'complex_logic_gate',
        text: `Gamma 字元 ${i + 1}：計算複合電路的最終輸出`,
        circuit: {
          gate1: { type: gate1Type, inputs: gate1Inputs },
          gate2: { type: gate2Type, inputs: gate2Type === 'NOT' ? [null, gate2SecondInput] : [null] }
        },
        options: ['0 (False)', '1 (True)'],
        correctAnswer: bit ? 1 : 0,
        explanation: `Complex circuit outputs ${bit ? '1' : '0'}`,
        targetBit: bit,
        bitGroup: 'Gamma',
        bitIndex: i,
        isComplex: true,
        isFinal: i === bitGroup.length - 1
      });
    }
    
    return questions;
  }
  
  // Get the bit group for the specified group
  let bitGroup = '';
  if (group === 'alpha') {
    bitGroup = newBits.substring(0, 3);
  } else if (group === 'beta') {
    bitGroup = newBits.substring(3, 6);
  } else if (group === 'gamma') {
    bitGroup = newBits.substring(6, 8);
  }
  
  // Generate new questions for the group
  let newGroupQuestions: unknown[] = [];
  if (group === 'alpha' || group === 'beta') {
    newGroupQuestions = generateSimpleQuestion(bitGroup, group.charAt(0).toUpperCase() + group.slice(1));
  } else {
    newGroupQuestions = generateComplexQuestion(bitGroup);
  }
  
  // Replace questions for the specified group in the current questions array
  const updatedQuestions = currentQuestions.map((q: any) => {
    if (q.bitGroup.toLowerCase() === group) {
      // Find the corresponding new question
      const newQuestion = newGroupQuestions.find((nq: any) => nq.bitIndex === q.bitIndex);
      return newQuestion || q;
    }
    return q;
  });
  
  return updatedQuestions;
} 