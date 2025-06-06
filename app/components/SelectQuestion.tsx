'use client';

import { useState } from 'react';

interface Question {
  id: string;
  type?: string;
  text: string;
  gateType?: string;
  inputs?: boolean[];
  circuit?: {
    gate1: { type: string; inputs: boolean[] };
    gate2: { type: string; inputs: (boolean | null)[] };
  };
  options: string[];
  correctAnswer: number;
  explanation?: string;
  isFinal?: boolean;
  isComplex?: boolean;
  bitGroup?: string;
  targetBits?: string;
}

interface SelectQuestionProps {
  question: Question;
  onAnswerSelect: (questionId: string, selectedAnswer: number) => void;
  selectedAnswer?: number;
  showResult?: boolean;
  disabled?: boolean;
}

export default function SelectQuestion({ 
  question, 
  onAnswerSelect, 
  selectedAnswer, 
  showResult = false,
  disabled = false
}: SelectQuestionProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerClick = (answerIndex: number) => {
    if (disabled || isSubmitted) return;
    
    onAnswerSelect(question.id, answerIndex);
    if (showResult) {
      setIsSubmitted(true);
    }
  };

  const getOptionClass = (index: number) => {
    const baseClass = "w-full p-3 md:p-4 text-left border-2 rounded-xl transition-all duration-200 font-medium";
    
    if (disabled || !showResult) {
      if (selectedAnswer === index) {
        return `${baseClass} bg-indigo-600 border-indigo-500 text-white`;
      }
      return `${baseClass} bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500`;
    }

    // Show results
    if (index === question.correctAnswer) {
      return `${baseClass} bg-green-600 border-green-500 text-white`;
    }
    
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return `${baseClass} bg-red-600 border-red-500 text-white`;
    }
    
    return `${baseClass} bg-gray-700 border-gray-600 text-gray-400`;
  };

  const getOptionIcon = (index: number) => {
    if (!showResult) return null;
    
    if (index === question.correctAnswer) {
      return <span className="text-green-300 font-bold">✓</span>;
    }
    
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return <span className="text-red-300 font-bold">✗</span>;
    }
    
    return null;
  };

  const getGateSymbol = (gateType: string) => {
    switch (gateType) {
      case 'AND': return '&';
      case 'OR': return '≥1';
      case 'NOT': return '¬';
      case 'XOR': return '⊕';
      case 'NAND': return '& ̄';
      case 'NOR': return '≥1 ̄';
      default: return '?';
    }
  };

  const getGateColor = (gateType: string) => {
    switch (gateType) {
      case 'AND': return 'bg-blue-600 border-blue-500';
      case 'OR': return 'bg-green-600 border-green-500';
      case 'NOT': return 'bg-red-600 border-red-500';
      case 'XOR': return 'bg-purple-600 border-purple-500';
      case 'NAND': return 'bg-indigo-600 border-indigo-500';
      case 'NOR': return 'bg-orange-600 border-orange-500';
      default: return 'bg-gray-600 border-gray-500';
    }
  };

  const LogicGateVisualization = ({ gateType, inputs }: { gateType: string, inputs: boolean[] }) => {
    return (
      <div className="flex items-center justify-center my-4 md:my-6 p-4 md:p-8 bg-gray-900/50 rounded-xl border border-gray-600 overflow-x-auto">
        <div className="relative flex items-center min-w-fit scale-90 md:scale-100">
          {/* Input Section */}
          <div className="flex flex-col items-end space-y-2 md:space-y-3 mr-3 md:mr-6">
            {inputs.map((input, index) => (
              <div key={index} className="flex items-center space-x-2 md:space-x-3">
                <span className="text-gray-300 text-xs md:text-sm font-medium min-w-[12px]">
                  {gateType === 'NOT' ? 'A' : index === 0 ? 'A' : 'B'}
                </span>
                <div
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    input 
                      ? 'bg-green-400 border-green-300 text-green-900' 
                      : 'bg-red-400 border-red-300 text-red-900'
                  }`}
                  title={`輸入 ${index + 1}: ${input ? '1' : '0'}`}
                >
                  {input ? '1' : '0'}
                </div>
                <div className="w-4 md:w-8 h-0.5 bg-gray-400" />
              </div>
            ))}
          </div>

          {/* Gate Body */}
          <div
            className={`${getGateColor(gateType)} border-2 rounded-lg px-4 md:px-6 py-3 md:py-4 text-white shadow-lg min-w-[60px] md:min-w-[80px]`}
          >
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold mb-1">{getGateSymbol(gateType)}</div>
              <div className="text-xs font-semibold">{gateType}</div>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex items-center space-x-2 md:space-x-3 ml-3 md:ml-6">
            <div className="w-4 md:w-8 h-0.5 bg-gray-400" />
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 bg-gray-400 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
              ?
            </div>
            <span className="text-gray-300 text-xs md:text-sm font-medium">輸出</span>
          </div>
        </div>
      </div>
    );
  };

  const ComplexCircuitVisualization = ({ circuit }: { circuit: any }) => {
    const gate1 = circuit.gate1;
    const gate2 = circuit.gate2;

    return (
      <div className="flex items-center justify-center my-4 md:my-6 p-4 md:p-8 bg-gray-900/50 rounded-xl border border-gray-600 overflow-x-auto">
        <div className="flex items-center space-x-4 md:space-x-8 min-w-fit scale-75 md:scale-100">
          {/* Gate 1 Section */}
          <div className="flex items-center">
            {/* Gate 1 Inputs */}
            <div className="flex flex-col items-end space-y-2 md:space-y-3 mr-3 md:mr-4">
              {gate1.inputs.map((input: boolean, index: number) => (
                <div key={index} className="flex items-center space-x-2 md:space-x-3">
                  <span className="text-gray-300 text-xs md:text-sm font-medium min-w-[12px]">
                    {index === 0 ? 'A' : 'B'}
                  </span>
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      input 
                        ? 'bg-green-400 border-green-300 text-green-900' 
                        : 'bg-red-400 border-red-300 text-red-900'
                    }`}
                    title={`輸入 ${index + 1}: ${input ? '1' : '0'}`}
                  >
                    {input ? '1' : '0'}
                  </div>
                  <div className="w-4 md:w-6 h-0.5 bg-gray-400" />
                </div>
              ))}
            </div>

            {/* Gate 1 Body */}
            <div className={`${getGateColor(gate1.type)} border-2 rounded-lg px-3 md:px-4 py-2 md:py-3 text-white shadow-lg min-w-[50px] md:min-w-[70px]`}>
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold mb-1">{getGateSymbol(gate1.type)}</div>
                <div className="text-xs font-semibold">{gate1.type}</div>
              </div>
            </div>

            {/* Gate 1 Output Connection */}
            <div className="ml-2 md:ml-4">
              <div className="w-4 md:w-6 h-0.5 bg-gray-400" />
            </div>
          </div>

          {/* Connection Wire */}
          <div className="w-4 md:w-8 h-0.5 bg-gray-400" />

          {/* Gate 2 Section */}
          <div className="flex items-center">
            {/* Gate 2 Inputs */}
            <div className="flex flex-col items-end space-y-2 md:space-y-3 mr-3 md:mr-4">
              {/* Input from Gate 1 */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-4 md:w-6 h-0.5 bg-gray-400" />
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 bg-yellow-400 border-yellow-300 flex items-center justify-center text-xs font-bold text-yellow-900" title="閩 1 輸出">
                  G1
                </div>
              </div>
              {/* Second input */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <span className="text-gray-300 text-xs md:text-sm font-medium min-w-[12px]">C</span>
                <div
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    gate2.inputs[1] 
                      ? 'bg-green-400 border-green-300 text-green-900' 
                      : 'bg-red-400 border-red-300 text-red-900'
                  }`}
                  title={`輸入 C: ${gate2.inputs[1] ? '1' : '0'}`}
                >
                  {gate2.inputs[1] ? '1' : '0'}
                </div>
                <div className="w-4 md:w-6 h-0.5 bg-gray-400" />
              </div>
            </div>

            {/* Gate 2 Body */}
            <div className={`${getGateColor(gate2.type)} border-2 rounded-lg px-3 md:px-4 py-2 md:py-3 text-white shadow-lg min-w-[50px] md:min-w-[70px]`}>
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold mb-1">{getGateSymbol(gate2.type)}</div>
                <div className="text-xs font-semibold">{gate2.type}</div>
              </div>
            </div>

            {/* Gate 2 Output */}
            <div className="flex items-center space-x-2 md:space-x-3 ml-2 md:ml-4">
              <div className="w-4 md:w-6 h-0.5 bg-gray-400" />
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 bg-gray-400 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                ?
              </div>
              <span className="text-gray-300 text-xs md:text-sm font-medium">輸出</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border p-4 md:p-6 ${
      question.isFinal ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700/50'
    }`}>
      {/* Question Text */}
      <div className="mb-4 md:mb-6">
        <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
          question.isFinal ? 'text-yellow-300' : 'text-white'
        }`}>
          {question.text}
        </h3>
        {question.isFinal && (
          <div className="text-xs md:text-sm text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-lg inline-block">
            🔑 這決定了您的位元貢獻
          </div>
        )}
      </div>

      {/* Circuit Visualization */}
      {question.isComplex && question.circuit ? (
        <ComplexCircuitVisualization circuit={question.circuit} />
      ) : question.gateType && question.inputs ? (
        <LogicGateVisualization 
          gateType={question.gateType} 
          inputs={question.inputs} 
        />
      ) : null}

      {/* Bit Group Info (without revealing target) */}
      {question.bitGroup && (
        <div className="mb-4 text-center">
          <div className="inline-block bg-gray-700/50 px-3 md:px-4 py-2 rounded-lg">
            <span className="text-gray-300 text-xs md:text-sm">電路： {question.bitGroup}</span>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2 md:space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(index)}
            disabled={disabled}
            className={getOptionClass(index)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base">{option}</span>
              {getOptionIcon(index)}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-700/50 rounded-xl border border-gray-600">
          <div className="text-xs md:text-sm text-gray-300">
            <strong className="text-indigo-400">解釋：</strong> {question.explanation}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {selectedAnswer !== undefined && (
        <div className="mt-4 text-center">
          {showResult ? (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              selectedAnswer === question.correctAnswer 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}>
              {selectedAnswer === question.correctAnswer ? '✓ 正確' : '✗ 錯誤'}
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
              已選擇答案
            </div>
          )}
        </div>
      )}
    </div>
  );
}