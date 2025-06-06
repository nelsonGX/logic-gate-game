'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function Main() {
  const [teamNumber, setTeamNumber] = useState('');
  const [numStudents, setNumStudents] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const router = useRouter();

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
                Team Setup
              </h1>
              <p className="text-gray-300 mt-2">Configure your game settings</p>
            </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="teamNumber" className="block text-sm font-semibold text-gray-200">
                Team Number
              </label>
              <input
                id="teamNumber"
                type="number"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                placeholder="Enter team number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="numStudents" className="block text-sm font-semibold text-gray-200">
                Number of Students
              </label>
              <input
                id="numStudents"
                type="number"
                value={numStudents}
                onChange={(e) => setNumStudents(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                placeholder="Enter number of students"
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
                  <span>Creating Game...</span>
                </div>
              ) : (
                'Create Game'
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Game Created!
            </h1>
            <p className="text-gray-300 mt-2">Share this code or QR with your students</p>
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm mb-2">Room Code:</p>
                <p className="text-3xl font-bold text-green-400 font-mono">{roomCode}</p>
              </div>
              
              {qrCodeUrl && (
                <div className="bg-white rounded-lg p-4 inline-block">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
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
                Copy Game Link
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
                Create Another Game
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
