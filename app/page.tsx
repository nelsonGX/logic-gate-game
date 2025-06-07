'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function Main() {
  const [teamNumber, setTeamNumber] = useState('');
  const [numStudents, setNumStudents] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameRoom, setGameRoom] = useState<any>(null);
  const router = useRouter();

  // Fetch game room data for student join status
  const fetchGameRoom = async (roomCode: string) => {
    try {
      const response = await fetch(`/api/game/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        setGameRoom(data);
      }
    } catch (error) {
      console.error('Error fetching game room:', error);
    }
  };

  // Poll for updates when room code exists
  useEffect(() => {
    if (roomCode) {
      fetchGameRoom(roomCode);
      const interval = setInterval(() => fetchGameRoom(roomCode), 3000);
      return () => clearInterval(interval);
    }
  }, [roomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamNumber: parseInt(teamNumber),
          numStudents: parseInt(numStudents),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newRoomCode = data.roomCode;
        setRoomCode(newRoomCode);
        
        // Generate QR code for the game URL
        const gameUrl = `${window.location.origin}/game/${newRoomCode}`;
        const qrDataUrl = await QRCode.toDataURL(gameUrl);
        setQrCodeUrl(qrDataUrl);
      } else {
        console.error('Failed to create game room');
      }
    } catch (error) {
      console.error('Error creating game room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!roomCode ? (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                隊伍設定
              </h1>
              <p className="text-gray-300 mt-2">設定您的遊戲參數</p>
            </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="teamNumber" className="block text-sm font-semibold text-gray-200">
                隊伍編號
              </label>
              <input
                id="teamNumber"
                type="number"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                placeholder="輸入隊伍編號"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="numStudents" className="block text-sm font-semibold text-gray-200">
                學生人數
              </label>
              <input
                id="numStudents"
                type="number"
                value={numStudents}
                onChange={(e) => setNumStudents(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                placeholder="輸入學生人數"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>建立遊戲中...</span>
                </div>
              ) : (
                '建立遊戲'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              遊戲已建立！
            </h1>
            <p className="text-gray-300 mt-2">將此代碼或QR碼分享給您的學生</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm mb-2">房間代碼：</p>
                <p className="text-3xl font-bold text-green-400 font-mono">{roomCode}</p>
              </div>
              
              {qrCodeUrl && (
                <div className="bg-white rounded-lg p-4 inline-block mb-6">
                  <Image src={qrCodeUrl} alt="QR Code" className="w-48 h-48" width={48} height={48} />
                </div>
              )}

              {/* Student Join Status */}
              {gameRoom && (
                <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">學生加入狀態</h3>
                  
                  {/* Join Progress */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">
                        {gameRoom.students?.length || 0}
                      </div>
                      <div className="text-xs text-gray-300">已加入</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-400">
                        {(gameRoom.studentAmount || 0) - (gameRoom.students?.length || 0)}
                      </div>
                      <div className="text-xs text-gray-300">等待中</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">
                        {gameRoom.studentAmount || 0}
                      </div>
                      <div className="text-xs text-gray-300">總計</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>加入進度</span>
                      <span>{Math.round(((gameRoom.students?.length || 0) / (gameRoom.studentAmount || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((gameRoom.students?.length || 0) / (gameRoom.studentAmount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recently Joined Students */}
                  {gameRoom.students && gameRoom.students.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">最近加入的學生：</h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {gameRoom.students
                          .slice(-4) // Show last 4 students
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          .map((student: any) => (
                            <div key={student.id} className="flex items-center justify-between bg-gray-600/50 rounded-lg p-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-gray-300">{student.displayName}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                字元 {student.charPosition}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Ready Indicator */}
                  {gameRoom.students?.length === gameRoom.studentAmount && (
                    <div className="mt-4 p-3 bg-green-600/20 border border-green-500/50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 font-semibold">所有學生已加入！可以開始遊戲。</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/host/${roomCode}`)}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
              >
Open Host Dashboard
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/game/${roomCode}`);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold border border-gray-600 transition-all duration-200"
              >
                複製遊戲連結
              </button>
              
              <button
                onClick={() => {
                  setRoomCode(null);
                  setQrCodeUrl(null);
                  setTeamNumber('');
                  setNumStudents('');
                }}
                className="w-full bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white py-2 px-6 rounded-xl font-medium border border-gray-600 transition-all duration-200"
              >
                建立另一個遊戲
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
