'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Student {
  id: string;
  displayName: string;
  assignedChar: string;
  charPosition: number;
  targetBits: string;
  solvedChar: string | null;
  alphaCompleted: boolean;
  betaCompleted: boolean;
  gammaCompleted: boolean;
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
                🔬 Logic Gate Escape Room
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


        {/* Escape Code Progress Display */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🔓 Escape Code Progress</h2>
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              {Array.from({ length: gameRoom?.answerString.length || 0 }, (_, index) => {
                const student = gameRoom?.students.find(s => s.charPosition === index);
                const displayChar = student?.isCompleted ? student.solvedChar : '_';
                const isCompleted = student?.isCompleted || false;
                const isWorking = student && !isCompleted;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <span
                      className={`font-mono text-3xl px-3 py-2 mx-1 rounded-lg border-2 ${
                        isCompleted 
                          ? 'bg-green-600/30 text-green-300 border-green-500' 
                          : isWorking
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500 animate-pulse'
                          : 'bg-gray-700/50 text-gray-400 border-gray-600'
                      }`}
                      title={student ? `${student.displayName}: ${isCompleted ? 'Completed' : 'Working...'}` : 'No student assigned'}
                    >
                      {displayChar}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">Pos {index}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-400 mb-3">
              {gameRoom?.students.filter(s => s.isCompleted).length} / {gameRoom?.students.length} characters decoded
            </div>
            
            {/* Show completed message if all done */}
            {gameRoom && gameRoom.students.length > 0 && 
             gameRoom.students.filter(s => s.isCompleted).length === gameRoom.students.length && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mt-4">
                <div className="text-green-300 font-bold text-lg mb-2">🎉 Escape Code Complete!</div>
                <div className="text-green-400">All agents have successfully decoded their characters!</div>
                <div className="font-mono text-2xl text-green-300 mt-2 tracking-wider">
                  {gameRoom.students
                    .sort((a, b) => a.charPosition - b.charPosition)
                    .map(s => s.solvedChar || '?')
                    .join('')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: gameRoom?.studentAmount || 0 }, (_, index) => {
            const student = gameRoom?.students.find(s => s.charPosition === index);
            
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
                    Character {index}
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
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300">
                      <strong>Student:</strong> {student.displayName}
                    </div>
                    <div className="text-sm text-gray-300">
                      <strong>Target:</strong> 
                      <span className="font-mono ml-1">???</span>
                    </div>
                    
                    {/* Bit Progress Display */}
                    <div className="bg-gray-700/30 rounded-lg p-2">
                      <div className="text-xs text-gray-400 mb-1">Bit Progress:</div>
                      <div className="flex justify-center items-center space-x-0.5">
                        {/* Alpha bits (0-2) */}
                        {[0, 1, 2].map((bitIndex) => (
                          <div
                            key={`alpha-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.alphaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Alpha bit ${bitIndex + 1}`}
                          >
                            {student.alphaCompleted ? student.targetBits[bitIndex] : '_'}
                          </div>
                        ))}
                        <div className="text-gray-500 mx-1 text-xs">|</div>
                        {/* Beta bits (3-5) */}
                        {[3, 4, 5].map((bitIndex) => (
                          <div
                            key={`beta-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.betaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Beta bit ${bitIndex - 2}`}
                          >
                            {student.betaCompleted ? student.targetBits[bitIndex] : '_'}
                          </div>
                        ))}
                        <div className="text-gray-500 mx-1 text-xs">|</div>
                        {/* Gamma bits (6-7) */}
                        {[6, 7].map((bitIndex) => (
                          <div
                            key={`gamma-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.gammaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Gamma bit ${bitIndex - 5}`}
                          >
                            {student.gammaCompleted ? student.targetBits[bitIndex] : '_'}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 text-center">
                        <span className={student.alphaCompleted ? 'text-green-400' : ''}>α</span>
                        <span className={student.betaCompleted ? 'text-green-400 ml-3' : 'ml-3'}>β</span>
                        <span className={student.gammaCompleted ? 'text-green-400 ml-3' : 'ml-3'}>γ</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300">
                      <strong>Status:</strong> {
                        student.isCompleted ? 'Completed' : 'Working...'
                      }
                    </div>
                    {student.solvedChar && (
                      <div className="text-sm text-green-300">
                        <strong>Decoded:</strong> 
                        <span className="font-mono ml-1 text-lg">{student.solvedChar}</span>
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

        {/* Student Join Status */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Student Join Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {gameRoom?.students.length || 0}
              </div>
              <div className="text-sm text-gray-300">Students Joined</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(gameRoom?.studentAmount || 0) - (gameRoom?.students.length || 0)}
              </div>
              <div className="text-sm text-gray-300">Waiting to Join</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {gameRoom?.studentAmount || 0}
              </div>
              <div className="text-sm text-gray-300">Total Expected</div>
            </div>
          </div>
          
          {/* Recently Joined Students */}
          {gameRoom && gameRoom.students.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Recently Joined Students</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gameRoom.students
                  .slice(-5) // Show last 5 students
                  .map((student) => (
                    <div key={student.id} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">{student.displayName}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Character {student.charPosition}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Join Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Join Progress</span>
              <span>{Math.round(((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100}%` }}
              />
            </div>
          </div>
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