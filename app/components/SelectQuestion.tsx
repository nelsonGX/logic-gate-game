'use client';

import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
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
    const baseClass = "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 font-medium";
    
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

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          {question.text}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(index)}
            disabled={disabled}
            className={getOptionClass(index)}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {getOptionIcon(index)}
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showResult && question.explanation && (
        <div className="mt-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
          <div className="text-sm text-gray-300">
            <strong className="text-indigo-400">Explanation:</strong> {question.explanation}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {selectedAnswer !== undefined && (
        <div className="mt-4 text-center">
          {showResult ? (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              selectedAnswer === question.correctAnswer 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}>
              {selectedAnswer === question.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
              Answer Selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}