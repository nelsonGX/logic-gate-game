'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LogicGate from '../../components/LogicGate';

interface GameRoom {
  id: string;
  roomCode: string;
  team: number;
  studentAmount: number;
  answerString: string;
  status: string;
}

interface LogicGate {
  id: string;
  type: 'AND' | 'OR' | 'NOT' | 'XOR';
  x: number;
  y: number;
  inputs: (boolean | null)[];
  output: boolean | null;
}

export default function GamePage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gates, setGates] = useState<LogicGate[]>([]);
  const [selectedGateType, setSelectedGateType] = useState<'AND' | 'OR' | 'NOT' | 'XOR'>('AND');
  const [draggedGate, setDraggedGate] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [assignedBit, setAssignedBit] = useState<number | null>(null);

  useEffect(() => {
    fetchGameRoom();
    if (isJoined) {
      const interval = setInterval(fetchGameRoom, 3000);
      return () => clearInterval(interval);
    }
  }, [roomCode, isJoined]);

  const fetchGameRoom = async () => {
    try {
      const response = await fetch(`/api/game/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setGameRoom(data);
      } else {
        setError('Game room not found');
      }
    } catch (err) {
      setError('Failed to load game room');
    } finally {
      setLoading(false);
    }
  };

  const addGate = (type: 'AND' | 'OR' | 'NOT' | 'XOR', x: number, y: number) => {
    const newGate: LogicGate = {
      id: `gate-${Date.now()}`,
      type,
      x,
      y,
      inputs: type === 'NOT' ? [null] : [null, null],
      output: null,
    };
    setGates([...gates, newGate]);
  };

  const handleInputChange = (gateId: string, inputIndex: number, value: boolean | null) => {
    setGates(gates.map(gate => {
      if (gate.id === gateId) {
        const newInputs = [...gate.inputs];
        newInputs[inputIndex] = value;
        return { ...gate, inputs: newInputs };
      }
      return gate;
    }));
  };

  const handleGateMove = (gateId: string, newX: number, newY: number) => {
    setGates(gates.map(gate => 
      gate.id === gateId ? { ...gate, x: newX, y: newY } : gate
    ));
  };

  const handleGateDelete = (gateId: string) => {
    setGates(gates.filter(gate => gate.id !== gateId));
  };

  const clearAllGates = () => {
    setGates([]);
  };

  const joinGame = async () => {
    if (!studentName.trim()) return;
    
    try {
      const response = await fetch(`/api/game/${roomCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: studentName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedBit(data.assignedBit);
        setIsJoined(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join game');
      }
    } catch (err) {
      setError('Failed to join game');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addGate(selectedGateType, x, y);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading game room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Join Game
              </h1>
              <p className="text-gray-300 mt-2">Room: {gameRoom?.roomCode}</p>
              <p className="text-sm text-gray-400 mt-1">
                {gameRoom?.students.length || 0} / {gameRoom?.studentAmount || 0} students joined
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="studentName" className="block text-sm font-semibold text-gray-200">
                  Your Name
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinGame()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <button
                onClick={joinGame}
                disabled={!studentName.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-2">Logic Gate Game</h1>
            <div className="text-sm text-gray-300">
              <p>Room: {gameRoom?.roomCode}</p>
              <p>Team: {gameRoom?.team}</p>
              <p>Your Bit: {assignedBit}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Gate Types</h2>
            <div className="space-y-2">
              {(['AND', 'OR', 'NOT', 'XOR'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedGateType(type)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    selectedGateType === type
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type} Gate
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Your Target</h2>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-300 text-sm mb-1">Bit {assignedBit} must be:</p>
              <p className="font-mono text-2xl text-green-400">
                {assignedBit !== null ? gameRoom?.answerString?.[assignedBit] || '?' : '?'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Build a circuit that outputs this value
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Actions</h2>
            <button
              onClick={clearAllGates}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              Clear All Gates
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Instructions</h2>
            <div className="text-sm text-gray-300 space-y-2">
              <p>1. Select a gate type</p>
              <p>2. Click on canvas to place</p>
              <p>3. Click inputs to toggle values</p>
              <p>4. Match the target pattern</p>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="w-full h-full bg-gray-900 cursor-crosshair"
            onClick={handleCanvasClick}
          >
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Gates */}
            {gates.map((gate) => (
              <LogicGate
                key={gate.id}
                id={gate.id}
                type={gate.type}
                x={gate.x}
                y={gate.y}
                inputs={gate.inputs}
                onInputChange={handleInputChange}
                onMove={handleGateMove}
                onDelete={handleGateDelete}
              />
            ))}

            {/* Help Text */}
            {gates.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <p className="text-lg mb-2">Click to place a {selectedGateType} gate</p>
                  <p className="text-sm">Build your logic circuit to match the target pattern</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}