'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Student {
  id: string;
  displayName: string;
  assignedBits: string;
  solvedBits: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

interface GameRoom {
  id: string;
  roomCode: string;
  team: number;
  studentAmount: number;
  answerString: string;
  status: string;
  students: Student[];
}

export default function HostView() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/game/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setGameRoom(data);
        setError(null);
      } else {
        setError('Game room not found');
      }
    } catch (err) {
      setError('Failed to load game room');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const getProgressPercentage = () => {
    if (!gameRoom || gameRoom.students.length === 0) return 0;
    const completedStudents = gameRoom.students.filter(s => s.isCompleted).length;
    return (completedStudents / gameRoom.students.length) * 100;
  };

  const parseBits = (bitsString: string | null): number[] => {
    if (!bitsString) return [];
    try {
      return JSON.parse(bitsString);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Host Dashboard
              </h1>
              <p className="text-gray-300 mt-1">Room: {gameRoom?.roomCode} | Team: {gameRoom?.team}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {gameRoom?.students.filter(s => s.isCompleted).length || 0} / {gameRoom?.studentAmount || 0}
              </div>
              <div className="text-sm text-gray-300">Students Completed</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Target Answer */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Target Answer</h2>
          <div className="flex items-center space-x-4">
            <div className="font-mono text-3xl text-green-400 bg-gray-700 px-4 py-2 rounded-lg">
              {gameRoom?.answerString}
            </div>
            <div className="text-gray-300">
              <div className="text-sm">8-bit binary pattern</div>
              <div className="text-xs">Students must build circuits to match this output</div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: gameRoom?.studentAmount || 0 }, (_, index) => {
            const student = gameRoom?.students.find(s => 
              parseBits(s.assignedBits).includes(index)
            );
            
            return (
              <div
                key={index}
                className={`bg-gray-800/80 backdrop-blur-sm rounded-xl border p-4 transition-all duration-300 ${
                  student?.isCompleted 
                    ? 'border-green-500/50 bg-green-900/20' 
                    : student 
                    ? 'border-blue-500/50 bg-blue-900/20' 
                    : 'border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">
                    Bit {index}
                  </h3>
                  <div className={`w-3 h-3 rounded-full ${
                    student?.isCompleted 
                      ? 'bg-green-400' 
                      : student 
                      ? 'bg-blue-400' 
                      : 'bg-gray-400'
                  }`} />
                </div>
                
                {student ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                      <strong>Student:</strong> {student.displayName}
                    </div>
                    <div className="text-sm text-gray-300">
                      <strong>Status:</strong> {
                        student.isCompleted ? 'Completed' : 'Working...'
                      }
                    </div>
                    {student.solvedBits && (
                      <div className="text-sm text-gray-300">
                        <strong>Result:</strong> 
                        <span className="font-mono ml-1">{student.solvedBits}</span>
                      </div>
                    )}
                    {student.completedAt && (
                      <div className="text-xs text-green-400">
                        Finished: {new Date(student.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Waiting for student to join...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Game URL */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Share with Students</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-700 rounded-lg p-3 font-mono text-sm text-gray-300">
              {typeof window !== 'undefined' ? `${window.location.origin}/game/${roomCode}` : ''}
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(`${window.location.origin}/game/${roomCode}`);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}