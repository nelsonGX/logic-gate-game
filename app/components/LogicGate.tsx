'use client';

import { useState } from 'react';

interface LogicGateProps {
  id: string;
  type: 'AND' | 'OR' | 'NOT' | 'XOR';
  x: number;
  y: number;
  inputs: (boolean | null)[];
  onInputChange: (gateId: string, inputIndex: number, value: boolean | null) => void;
  onMove: (gateId: string, newX: number, newY: number) => void;
  onDelete: (gateId: string) => void;
}

export default function LogicGate({ 
  id, 
  type, 
  x, 
  y, 
  inputs, 
  onInputChange, 
  onMove, 
  onDelete 
}: LogicGateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const calculateOutput = (): boolean | null => {
    if (inputs.some(input => input === null)) return null;
    
    switch (type) {
      case 'AND':
        return inputs[0] && inputs[1];
      case 'OR':
        return inputs[0] || inputs[1];
      case 'NOT':
        return !inputs[0];
      case 'XOR':
        return inputs[0] !== inputs[1];
      default:
        return null;
    }
  };

  const output = calculateOutput();

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getGateColor = () => {
    switch (type) {
      case 'AND': return 'bg-blue-600 border-blue-500';
      case 'OR': return 'bg-green-600 border-green-500';
      case 'NOT': return 'bg-red-600 border-red-500';
      case 'XOR': return 'bg-purple-600 border-purple-500';
      default: return 'bg-gray-600 border-gray-500';
    }
  };

  const getGateSymbol = () => {
    switch (type) {
      case 'AND': return '&';
      case 'OR': return '≥1';
      case 'NOT': return '¬';
      case 'XOR': return '⊕';
      default: return '?';
    }
  };

  return (
    <div
      className={`absolute select-none transition-all duration-200 ${
        isDragging ? 'scale-110 z-50' : 'z-10'
      } ${showControls ? 'z-20' : ''}`}
      style={{ left: x, top: y }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Gate Body */}
      <div
        className={`relative ${getGateColor()} border-2 rounded-lg cursor-move shadow-lg hover:shadow-xl transition-all duration-200`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Input Terminals */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
          <div className="flex flex-col space-y-2">
            {inputs.map((input, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${
                  input === null 
                    ? 'bg-gray-400 border-gray-300' 
                    : input 
                    ? 'bg-green-400 border-green-300' 
                    : 'bg-red-400 border-red-300'
                }`}
                onClick={() => {
                  const newValue = input === null ? true : input === true ? false : null;
                  onInputChange(id, index, newValue);
                }}
                title={`Input ${index + 1}: ${input === null ? 'Unset' : input ? 'True' : 'False'}`}
              />
            ))}
          </div>
        </div>

        {/* Gate Content */}
        <div className="px-6 py-4 text-white">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{getGateSymbol()}</div>
            <div className="text-xs font-semibold">{type}</div>
          </div>
        </div>

        {/* Output Terminal */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              output === null 
                ? 'bg-gray-400 border-gray-300' 
                : output 
                ? 'bg-green-400 border-green-300' 
                : 'bg-red-400 border-red-300'
            }`}
            title={`Output: ${output === null ? 'Unset' : output ? 'True' : 'False'}`}
          />
        </div>

        {/* Controls */}
        {showControls && (
          <div className="absolute -top-8 right-0">
            <button
              onClick={() => onDelete(id)}
              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors"
              title="Delete gate"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Connection Points Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Input connection indicators */}
        {inputs.map((input, index) => (
          <div
            key={`input-${index}`}
            className="absolute w-2 h-2 bg-white rounded-full opacity-50"
            style={{
              left: -4,
              top: `${50 + (index - (inputs.length - 1) / 2) * 20}%`,
              transform: 'translateY(-50%)',
            }}
          />
        ))}
        
        {/* Output connection indicator */}
        <div
          className="absolute w-2 h-2 bg-white rounded-full opacity-50"
          style={{
            right: -4,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      </div>
    </div>
  );
}