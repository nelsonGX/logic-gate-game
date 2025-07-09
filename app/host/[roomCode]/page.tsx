'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  alphaAnswers: string | null;
  betaAnswers: string | null;
  gammaAnswers: string | null;
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
  gameStartedAt: string | null;
  students: Student[];
}

export default function HostView() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterInputs, setCharacterInputs] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<boolean[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [gameExpired, setGameExpired] = useState(false);

  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/game/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setGameRoom(data);
        setError(null);
        
        // Initialize character inputs array based on answer string length only if not already initialized
        if (data.answerString && characterInputs.length !== data.answerString.length) {
          setCharacterInputs(prev => {
            const newArray = new Array(data.answerString.length).fill('');
            // Preserve existing inputs if they exist
            for (let i = 0; i < Math.min(prev.length, newArray.length); i++) {
              newArray[i] = prev[i] || '';
            }
            return newArray;
          });
          setVerificationStatus(prev => {
            const newArray = new Array(data.answerString.length).fill(false);
            // Preserve existing verification status if they exist
            for (let i = 0; i < Math.min(prev.length, newArray.length); i++) {
              newArray[i] = prev[i] || false;
            }
            return newArray;
          });
        }
      } else {
        setError('Game room not found');
      }
    } catch (err) {
      setError('Failed to load game room');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch(`/api/game/${roomCode}/start`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchGameData(); // Refresh the game data
      } else {
        setError('Failed to start game');
      }
    } catch (err) {
      setError('Failed to start game');
    }
  };

  const handleCharacterInput = (index: number, value: string) => {
    const newInputs = [...characterInputs];
    newInputs[index] = value.toUpperCase(); // Convert to uppercase
    setCharacterInputs(newInputs);
    
    // Auto-verify the character if it's a single character
    if (value.length === 1) {
      verifyCharacter(index, value.toUpperCase());
    }
  };

  const verifyCharacter = (index: number, inputChar: string) => {
    if (!gameRoom || !gameRoom.answerString) return;
    
    const correctChar = gameRoom.answerString[index];
    const isCorrect = inputChar === correctChar;
    
    const newStatus = [...verificationStatus];
    newStatus[index] = isCorrect;
    setVerificationStatus(newStatus);
    
    return isCorrect;
  };

  const verifyAllCharacters = () => {
    if (!gameRoom || !gameRoom.answerString) return;
    
    const newStatus = characterInputs.map((input, index) => 
      input === gameRoom.answerString[index]
    );
    setVerificationStatus(newStatus);
    
    const allCorrect = newStatus.every(status => status);
    if (allCorrect) {
      alert('🎉 所有字元驗證正確！');
    }
  };

  const resetVerification = () => {
    setCharacterInputs(new Array(gameRoom?.answerString.length || 0).fill(''));
    setVerificationStatus(new Array(gameRoom?.answerString.length || 0).fill(false));
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Countdown timer effect
  useEffect(() => {
    calculateTimeRemaining();
    const countdownInterval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(countdownInterval);
  }, [gameRoom?.gameStartedAt, gameRoom?.status, gameExpired]);

  const getProgressPercentage = () => {
    if (!gameRoom || gameRoom.students.length === 0) return 0;
    const completedStudents = gameRoom.students.filter(s => s.isCompleted).length;
    return (completedStudents / gameRoom.students.length) * 100;
  };

  // Calculate time remaining
  const calculateTimeRemaining = () => {
    if (!gameRoom?.gameStartedAt || gameRoom.status !== 'active') {
      return;
    }

    const startTime = new Date(gameRoom.gameStartedAt).getTime();
    const now = new Date().getTime();
    const elapsed = now - startTime;
    const totalTime = 40 * 60 * 1000; // 40 minutes in milliseconds
    const remaining = Math.max(0, totalTime - elapsed);

    setTimeRemaining(remaining);

    // If time is up, expire the game
    if (remaining <= 0 && !gameExpired) {
      expireGame();
    }
  };

  // Function to expire the game
  const expireGame = async () => {
    try {
      const response = await fetch(`/api/game/${roomCode}/expire`, {
        method: 'POST',
      });
      if (response.ok) {
        setGameExpired(true);
        fetchGameData(); // Refresh data to show expired status
      }
    } catch (err) {
      console.error('Failed to expire game:', err);
    }
  };

  // Format time for display
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">載入遊戲房間中...</div>
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

  // Show waiting room if game status is "waiting"
  if (gameRoom?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                邏輯閘解謎
              </h1>
              <p className="text-gray-300 text-lg">房間: {gameRoom?.roomCode} | 小隊: {gameRoom?.team}</p>
              <p className="text-gray-400 text-sm mt-2">等待全部學生加入遊戲...</p>
            </div>
          </div>

          {/* Student Join Status */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">學生加入狀態</h2>
            
            {/* Join Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {gameRoom?.students.length || 0}
                </div>
                <div className="text-gray-300">加入的學生數量</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {(gameRoom?.studentAmount || 0) - (gameRoom?.students.length || 0)}
                </div>
                <div className="text-gray-300">尚未加入</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {gameRoom?.studentAmount || 0}
                </div>
                <div className="text-gray-300">學生總數</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>加入狀態</span>
                <span>{Math.round(((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Student List */}
            {gameRoom && gameRoom.students.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">已加入的學生數量</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {gameRoom.students.map((student) => (
                    <div key={student.id} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-gray-300 font-medium">{student.displayName}</span>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                        字元 {student.charPosition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready Status & Start Button */}
            <div className="text-center">
              {gameRoom.students.length === gameRoom.studentAmount ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 font-semibold text-lg">全部學生已加入！</span>
                    </div>
                    <p className="text-green-400">可以準備開始了</p>
                  </div>
                  <button
                    onClick={startGame}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    🚀 Start Game
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-300 font-semibold">等待更多學生...</span>
                  </div>
                  <p className="text-yellow-400">
                    還有 {(gameRoom?.studentAmount || 0) - (gameRoom?.students.length || 0)} 個學生沒加入！
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Game URL for sharing */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">分享</h2>
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
                複製連結
              </button>
            </div>
          </div>
        </div>
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
                邏輯閘解碼
              </h1>
              <p className="text-gray-300 mt-1">房間： {gameRoom?.roomCode} | 隊伍： {gameRoom?.team}</p>
            </div>
            
            {/* Countdown Timer */}
            {timeRemaining !== null && (
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  timeRemaining <= 5 * 60 * 1000 ? 'text-red-400' : 
                  timeRemaining <= 10 * 60 * 1000 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {timeRemaining >= 0 ?
                    `⏰ ${formatTime(timeRemaining)}`
                    : '⏰ 時間已到，遊戲已結束'
                  }
                </div>
                <div className="text-sm text-gray-300">剩餘時間</div>
              </div>
            )}
            
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {gameRoom?.students.filter(s => s.isCompleted).length || 0} / {gameRoom?.studentAmount || 0}
              </div>
              <div className="text-sm text-gray-300">學生完成數</div>
            </div>
            <a onClick={() => {expireGame(); window.location.href = '/'}} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            🏠 返回主頁
            </a>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>總體進度</span>
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


        {/* Escape Code Progress & Manual Character Verification */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">🔓 逃脫密碼進度 & 驗證</h2>
          </div>
          
          {/* Progress Display */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-2 mb-4">
              {Array.from({ length: gameRoom?.answerString.length || 0 }, (_, index) => {
                const student = gameRoom?.students.find(s => s.charPosition === index);
                const displayChar = student?.isCompleted ? '✔' : '_';
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
                      title={student ? `${student.displayName}: ${isCompleted ? '已完成' : '作業中...'}` : '無學生指派'}
                    >
                      {displayChar}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">位置 {index}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-gray-400 mb-3">
              {gameRoom?.students.filter(s => s.isCompleted).length} / {gameRoom?.students.length} 字元已解碼
            </div>
            
            {/* Show completed message if all done */}
            {gameRoom && gameRoom.students.length > 0 && 
             gameRoom.students.filter(s => s.isCompleted).length === gameRoom.students.length && (
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mt-4">
                <div className="text-green-300 font-bold text-lg mb-2">🎉 逃脫密碼完成！</div>
                <div className="text-green-400">所有學生已成功解碼他們的字元！</div>
                <div className="font-mono text-2xl text-green-300 mt-2 tracking-wider">
                </div>
              </div>
            )}
          </div>
              
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-3">
              請輸入學生從表格中找到的字元：
            </div>
            <div className="flex justify-center items-center space-x-2 mb-4">
              {Array.from({ length: gameRoom?.answerString.length || 0 }, (_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <input
                    type="text"
                    maxLength={1}
                    value={characterInputs[index] || ''}
                    onChange={(e) => handleCharacterInput(index, e.target.value)}
                    className={`w-12 h-12 text-center font-mono text-lg font-bold rounded-lg border-2 transition-all duration-200 ${
                      characterInputs[index] && characterInputs[index].length === 1
                        ? verificationStatus[index]
                          ? 'bg-green-600/30 border-green-500 text-green-300'
                          : 'bg-red-600/30 border-red-500 text-red-300'
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="?"
                  />
                  <span className="text-xs text-gray-400 mt-1">位置 {index}</span>
                  {characterInputs[index] && characterInputs[index].length === 1 && (
                    <span className={`text-xs mt-1 ${verificationStatus[index] ? 'text-green-400' : 'text-red-400'}`}>
                      {verificationStatus[index] ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              ))}
            </div>
                        
            {/* Verification Status Summary */}
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-sm text-gray-300 mb-2">驗證狀態：</div>
              <div className="flex justify-center space-x-4 text-sm">
                <span className="text-green-400">
                  ✓ 正確：{verificationStatus.filter(status => status).length}
                </span>
                <span className="text-red-400">
                  ✗ 錯誤：{verificationStatus.filter((status, index) => 
                    characterInputs[index] && characterInputs[index].length === 1 && !status
                  ).length}
                </span>
                <span className="text-gray-400">
                  ⏳ 待輸入：{verificationStatus.filter((status, index) => 
                    !characterInputs[index] || characterInputs[index].length === 0
                  ).length}
                </span>
              </div>
            </div>
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
                    字元 {index}
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
                      <strong>學生：</strong> {student.displayName}
                    </div>
                    
                    {/* Bit Progress Display */}
                    <div className="bg-gray-700/30 rounded-lg p-2">
                      <div className="text-xs text-gray-400 mb-1">位元進度：</div>
                      <div className="flex justify-center items-center space-x-0.5">
                        {/* Alpha bits (0-2) */}
                        {[1, 3, 5].map((bitIndex) => (
                          <div
                            key={`alpha-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.alphaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Alpha bit ${bitIndex + 1}`}
                          >
                            {student.alphaCompleted && student.alphaAnswers ? 
                              (() => {
                                try {
                                  const answers = JSON.parse(student.alphaAnswers);
                                  return answers[bitIndex] || '_';
                                } catch {
                                  return '_';
                                }
                              })() : '_'}
                          </div>
                        ))}
                        <div className="text-gray-500 mx-1 text-xs">|</div>
                        {/* Beta bits (3-5) */}
                        {[1, 3, 5].map((bitIndex) => (
                          <div
                            key={`beta-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.betaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Beta bit ${bitIndex - 2}`}
                          >
                            {student.betaCompleted && student.betaAnswers ? 
                              (() => {
                                try {
                                  const answers = JSON.parse(student.betaAnswers);
                                  return answers[bitIndex] || '_';
                                } catch {
                                  return '_';
                                }
                              })() : '_'}
                          </div>
                        ))}
                        <div className="text-gray-500 mx-1 text-xs">|</div>
                        {/* Gamma bits (6-7) */}
                        {[1, 3].map((bitIndex) => (
                          <div
                            key={`gamma-${bitIndex}`}
                            className={`w-6 h-6 rounded border flex items-center justify-center font-mono text-xs font-bold ${
                              student.gammaCompleted
                                ? 'bg-green-600/30 border-green-500 text-green-300'
                                : 'bg-gray-600/50 border-gray-500 text-gray-400'
                            }`}
                            title={`Gamma bit ${bitIndex - 5}`}
                          >
                            {student.gammaCompleted && student.gammaAnswers ? 
                              (() => {
                                try {
                                  const answers = JSON.parse(student.gammaAnswers);
                                  return answers[bitIndex] || '_';
                                } catch {
                                  return '_';
                                }
                              })() : '_'}
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
                      <strong>狀態：</strong> {
                        student.isCompleted ? '已完成' : '作業中...'
                      }
                    </div>
                    {student.completedAt && (
                      <div className="text-xs text-green-400">
                        完成時間： {new Date(student.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    等待學生加入...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Student Join Status */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">學生加入狀態</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {gameRoom?.students.length || 0}
              </div>
              <div className="text-sm text-gray-300">學生已加入</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(gameRoom?.studentAmount || 0) - (gameRoom?.students.length || 0)}
              </div>
              <div className="text-sm text-gray-300">等待加入</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {gameRoom?.studentAmount || 0}
              </div>
              <div className="text-sm text-gray-300">預期總數</div>
            </div>
          </div>
          
          {/* Recently Joined Students */}
          {gameRoom && gameRoom.students.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">最近加入的學生</h3>
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
                        字元 {student.charPosition}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Join Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>加入進度</span>
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
          <h2 className="text-xl font-bold text-white mb-4">與學生分享</h2>
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
              複製連結
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}