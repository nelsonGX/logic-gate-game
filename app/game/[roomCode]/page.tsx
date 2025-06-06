'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SelectQuestion from '../../components/SelectQuestion';

interface GameRoom {
  id: string;
  roomCode: string;
  team: number;
  studentAmount: number;
  answerString: string;
  status: string;
  students: Student[];
}

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

interface Question {
  id: string;
  type?: string;
  text: string;
  gateType?: string;
  inputs?: boolean[];
  options: string[];
  correctAnswer: number;
  explanation?: string;
  isFinal?: boolean;
  bitGroup: string;
  bitIndex: number;
}

export default function GamePage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [assignedChar, setAssignedChar] = useState<string | null>(null);
  const [charPosition, setCharPosition] = useState<number | null>(null);
  const [targetBits, setTargetBits] = useState<string>('00000000');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [alphaAnswers, setAlphaAnswers] = useState<number[]>([]);
  const [betaAnswers, setBetaAnswers] = useState<number[]>([]);
  const [gammaAnswers, setGammaAnswers] = useState<number[]>([]);
  const [alphaCompleted, setAlphaCompleted] = useState(false);
  const [betaCompleted, setBetaCompleted] = useState(false);
  const [gammaCompleted, setGammaCompleted] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<'alpha' | 'beta' | 'gamma'>('alpha');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitResult, setSubmitResult] = useState<any>(null);

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
        setStudentId(data.studentId);
        setAssignedChar(data.assignedChar);
        setCharPosition(data.charPosition);
        setTargetBits(data.targetBits);
        setQuestions(data.questions);
        
        // Group questions and initialize answer arrays
        const alphaQuestions = data.questions.filter((q: Question) => q.bitGroup.toLowerCase() === 'alpha');
        const betaQuestions = data.questions.filter((q: Question) => q.bitGroup.toLowerCase() === 'beta');
        const gammaQuestions = data.questions.filter((q: Question) => q.bitGroup.toLowerCase() === 'gamma');
        
        setAlphaAnswers(new Array(alphaQuestions.length).fill(-1));
        setBetaAnswers(new Array(betaQuestions.length).fill(-1));
        setGammaAnswers(new Array(gammaQuestions.length).fill(-1));
        setIsJoined(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join game');
      }
    } catch (err) {
      setError('Failed to join game');
    }
  };

  const handleAnswerSelect = (questionId: string, selectedAnswer: number) => {
    const currentQuestion = getCurrentQuestions()[currentQuestionIndex];
    const group = currentQuestion.bitGroup.toLowerCase();
    const groupQuestionIndex = getCurrentQuestions().findIndex((q, i) => i === currentQuestionIndex);
    
    if (group === 'alpha') {
      const newAnswers = [...alphaAnswers];
      newAnswers[groupQuestionIndex] = selectedAnswer;
      setAlphaAnswers(newAnswers);
    } else if (group === 'beta') {
      const newAnswers = [...betaAnswers];
      newAnswers[groupQuestionIndex] = selectedAnswer;
      setBetaAnswers(newAnswers);
    } else if (group === 'gamma') {
      const newAnswers = [...gammaAnswers];
      newAnswers[groupQuestionIndex] = selectedAnswer;
      setGammaAnswers(newAnswers);
    }
  };

  const getCurrentQuestions = () => {
    return questions.filter(q => q.bitGroup.toLowerCase() === currentGroup);
  };

  const getCurrentAnswers = () => {
    if (currentGroup === 'alpha') return alphaAnswers;
    if (currentGroup === 'beta') return betaAnswers;
    return gammaAnswers;
  };

  const goToNextQuestion = () => {
    const currentQuestions = getCurrentQuestions();
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitGroupAnswers = async () => {
    const currentAnswers = getCurrentAnswers();
    
    if (!studentId || currentAnswers.some(answer => answer === -1)) {
      setError(`Please answer all ${currentGroup} questions before submitting`);
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group: currentGroup,
          answers: currentAnswers,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitResult(result);
        
        // Update group completion status
        if (currentGroup === 'alpha') setAlphaCompleted(result.correct);
        else if (currentGroup === 'beta') setBetaCompleted(result.correct);
        else if (currentGroup === 'gamma') setGammaCompleted(result.correct);
        
        fetchGameRoom(); // Refresh to see updated completion status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit answers');
      }
    } catch (err) {
      setError('Failed to submit answers');
    }
  };

  const resetGroup = () => {
    const currentQuestions = getCurrentQuestions();
    const emptyAnswers = new Array(currentQuestions.length).fill(-1);
    
    if (currentGroup === 'alpha') {
      setAlphaAnswers(emptyAnswers);
      setAlphaCompleted(false);
    } else if (currentGroup === 'beta') {
      setBetaAnswers(emptyAnswers);
      setBetaCompleted(false);
    } else if (currentGroup === 'gamma') {
      setGammaAnswers(emptyAnswers);
      setGammaCompleted(false);
    }
    
    setCurrentQuestionIndex(0);
    setSubmitResult(null);
  };

  const switchGroup = (newGroup: 'alpha' | 'beta' | 'gamma') => {
    setCurrentGroup(newGroup);
    setCurrentQuestionIndex(0);
    setSubmitResult(null);
  };

  const getGroupCompletionStatus = (group: 'alpha' | 'beta' | 'gamma') => {
    if (group === 'alpha') return alphaCompleted;
    if (group === 'beta') return betaCompleted;
    return gammaCompleted;
  };

  const getBitValue = (group: 'alpha' | 'beta' | 'gamma', bitIndex: number) => {
    if (!getGroupCompletionStatus(group)) return '_';
    
    if (group === 'alpha') {
      return targetBits[bitIndex] || '_';
    } else if (group === 'beta') {
      return targetBits[bitIndex + 3] || '_';
    } else { // gamma
      return targetBits[bitIndex + 6] || '_';
    }
  };

  // Progress display component
  const ProgressDisplay = () => {
    if (!gameRoom) return null;

    const displayChars = [];
    for (let i = 0; i < gameRoom.answerString.length; i++) {
      const student = gameRoom.students.find(s => s.charPosition === i);
      const char = student?.solvedChar || '_';
      const isCompleted = student?.isCompleted || false;
      
      displayChars.push(
        <span
          key={i}
          className={`font-mono text-2xl px-2 py-1 mx-1 rounded ${
            isCompleted 
              ? 'bg-green-600/30 text-green-300 border border-green-500' 
              : 'bg-gray-700/50 text-gray-400 border border-gray-600'
          }`}
          title={student ? `${student.displayName}: ${isCompleted ? 'Completed' : 'Working...'}` : 'No student assigned'}
        >
          {char}
        </span>
      );
    }

    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Escape Code Progress</h3>
          <div className="flex justify-center items-center flex-wrap">
            {displayChars}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            {gameRoom.students.filter(s => s.isCompleted).length} / {gameRoom.students.length} characters unlocked
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading escape room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => setError(null)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
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
                🔬 Logic Gate Escape Room
              </h1>
              <p className="text-gray-300 mt-2">Room: {gameRoom?.roomCode}</p>
              <p className="text-xs text-gray-500 mt-2">
                Each agent solves logic gate puzzles to contribute bits to the escape code
              </p>
            </div>

            {/* Student Join Status */}
            <div className="bg-gray-700/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Agent Status</h3>
              
              {/* Join Progress */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {gameRoom?.students.length || 0}
                  </div>
                  <div className="text-xs text-gray-300">Joined</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {(gameRoom?.studentAmount || 0) - (gameRoom?.students.length || 0)}
                  </div>
                  <div className="text-xs text-gray-300">Waiting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {gameRoom?.studentAmount || 0}
                  </div>
                  <div className="text-xs text-gray-300">Total</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Join Progress</span>
                  <span>{Math.round(((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((gameRoom?.students.length || 0) / (gameRoom?.studentAmount || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Recently Joined */}
              {gameRoom && gameRoom.students.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Agents:</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {gameRoom.students
                      .slice(-3) // Show last 3 students
                      .map((student) => (
                        <div key={student.id} className="flex items-center justify-between bg-gray-600/50 rounded-lg p-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">{student.displayName}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Char {student.charPosition}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="studentName" className="block text-sm font-semibold text-gray-200">
                  Agent Name
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinGame()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:bg-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your agent name"
                  required
                />
              </div>

              <button
                onClick={joinGame}
                disabled={!studentName.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
              >
                Enter Escape Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show results screen after group submission
  if (submitResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                {submitResult.correct ? '🎉 Group Completed!' : '❌ Try Again'}
              </h1>
              <div className="text-lg text-indigo-400 mb-4">
                {submitResult.group.toUpperCase()} Circuit: 
                <span className={`font-mono text-3xl ml-2 ${submitResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {submitResult.correct ? '✓' : '✗'}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {submitResult.message}
              </div>
              {submitResult.allGroupsCompleted && (
                <div className="text-lg text-green-400 mt-4">
                  🎊 Target character fully decoded! 🎊
                </div>
              )}
            </div>

            {/* Group Progress */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {['alpha', 'beta', 'gamma'].map((group) => (
                <div key={group} className="text-center">
                  <div className={`p-4 rounded-xl border-2 ${
                    getGroupCompletionStatus(group as 'alpha' | 'beta' | 'gamma')
                      ? 'bg-green-600/20 border-green-500 text-green-400'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400'
                  }`}>
                    <div className="text-xl font-bold mb-2">{group.toUpperCase()}</div>
                    <div className="text-sm">
                      {getGroupCompletionStatus(group as 'alpha' | 'beta' | 'gamma') ? 'Complete' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              {!submitResult.correct && (
                <button
                  onClick={resetGroup}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Try {currentGroup.toUpperCase()} Again
                </button>
              )}
              <button
                onClick={() => {
                  setSubmitResult(null);
                  if (submitResult.correct) {
                    // Auto-advance to next group if current group was completed successfully
                    if (currentGroup === 'alpha') {
                      switchGroup('beta');
                    } else if (currentGroup === 'beta') {
                      switchGroup('gamma');
                    }
                    // If gamma is completed, stay on gamma (all groups done)
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {submitResult.correct && currentGroup === 'alpha' ? 'Continue to Beta' :
                 submitResult.correct && currentGroup === 'beta' ? 'Continue to Gamma' :
                 submitResult.correct && currentGroup === 'gamma' ? 'Character Complete!' :
                 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  const currentQuestions = getCurrentQuestions();
  const currentAnswers = getCurrentAnswers();
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const allAnswered = currentAnswers.every(answer => answer !== -1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">🔬 Character Decoder Challenge</h1>
          <div className="text-sm md:text-base text-gray-300 space-y-1 md:space-y-0">
            <div className="md:inline">
              Agent: <span className="text-indigo-400 font-semibold">{studentName}</span>
            </div>
            <div className="md:inline md:ml-2">
              | Target: <span className="text-yellow-400 font-mono text-lg md:text-xl">???</span>
            </div>
            <div className="md:inline md:ml-2">
              | Position: {charPosition}
            </div>
            <div className="md:inline md:ml-2">
              | Room: {gameRoom?.roomCode}
            </div>
          </div>
          <div className="text-xs md:text-sm text-gray-400 mt-2">
            Solve logic gate circuits group by group to decode your assigned character
          </div>
        </div>

        {/* Group Selection Tabs */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-800 rounded-lg p-1">
              {['alpha', 'beta', 'gamma'].map((group) => (
                <button
                  key={group}
                  onClick={() => switchGroup(group as 'alpha' | 'beta' | 'gamma')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                    currentGroup === group
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200'
                  } ${getGroupCompletionStatus(group as 'alpha' | 'beta' | 'gamma') ? 'border border-green-500' : ''}`}
                >
                  {group.toUpperCase()}
                  {getGroupCompletionStatus(group as 'alpha' | 'beta' | 'gamma') && (
                    <span className="ml-1 text-green-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bit Progress Display */}
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Target Bits Progress</h3>
              <div className="text-sm text-gray-400 mb-3">
                Your assigned character → 8-bit binary
              </div>
              <div className="flex justify-center items-center space-x-1">
                {/* Alpha bits (0-2) */}
                <div className="flex space-x-1">
                  {[0, 1, 2].map((bitIndex) => (
                    <div
                      key={`alpha-${bitIndex}`}
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center font-mono text-sm font-bold ${
                        alphaCompleted
                          ? 'bg-green-600/30 border-green-500 text-green-300'
                          : 'bg-gray-700/50 border-gray-600 text-gray-400'
                      }`}
                      title={`Alpha bit ${bitIndex + 1}`}
                    >
                      {getBitValue('alpha', bitIndex)}
                    </div>
                  ))}
                </div>
                <div className="text-gray-500 mx-2">|</div>
                {/* Beta bits (3-5) */}
                <div className="flex space-x-1">
                  {[3, 4, 5].map((bitIndex) => (
                    <div
                      key={`beta-${bitIndex}`}
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center font-mono text-sm font-bold ${
                        betaCompleted
                          ? 'bg-green-600/30 border-green-500 text-green-300'
                          : 'bg-gray-700/50 border-gray-600 text-gray-400'
                      }`}
                      title={`Beta bit ${bitIndex - 2}`}
                    >
                      {getBitValue('beta', bitIndex - 3)}
                    </div>
                  ))}
                </div>
                <div className="text-gray-500 mx-2">|</div>
                {/* Gamma bits (6-7) */}
                <div className="flex space-x-1">
                  {[6, 7].map((bitIndex) => (
                    <div
                      key={`gamma-${bitIndex}`}
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center font-mono text-sm font-bold ${
                        gammaCompleted
                          ? 'bg-green-600/30 border-green-500 text-green-300'
                          : 'bg-gray-700/50 border-gray-600 text-gray-400'
                      }`}
                      title={`Gamma bit ${bitIndex - 5}`}
                    >
                      {getBitValue('gamma', bitIndex - 6)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-3">
                <span className="text-blue-400">Alpha (3 bits)</span> | 
                <span className="text-purple-400 ml-1">Beta (3 bits)</span> | 
                <span className="text-yellow-400 ml-1">Gamma (2 bits)</span>
              </div>
            </div>
          </div>
        </div>


        {/* Question Progress Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-2">
            <span>{currentGroup.toUpperCase()} Circuit {currentQuestionIndex + 1} of {currentQuestions.length}</span>
            <span>{currentAnswers.filter(a => a !== -1).length} answered</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="mb-6 md:mb-8">
            <SelectQuestion
              question={currentQuestion}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswer={currentAnswers[currentQuestionIndex] !== -1 ? currentAnswers[currentQuestionIndex] : undefined}
              disabled={false}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="w-full md:w-auto bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ← Previous
          </button>

          <div className="flex flex-wrap justify-center gap-2 max-w-full">
            {currentQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 md:w-8 md:h-8 rounded-full font-semibold text-xs md:text-sm transition-colors flex-shrink-0 ${
                  index === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : currentAnswers[index] !== -1
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                } ${question.isFinal ? 'ring-2 ring-yellow-400' : ''}`}
                title={question.isFinal ? 'Final Question - Determines Your Bit' : `Question ${index + 1}`}
              >
                {question.isFinal ? '🔑' : index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === currentQuestions.length - 1 ? (
            <button
              onClick={submitGroupAnswers}
              disabled={!allAnswered}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Submit {currentGroup.toUpperCase()} →
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === currentQuestions.length - 1}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {/* Submit Button for all questions answered */}
        {allAnswered && currentQuestionIndex !== currentQuestions.length - 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={submitGroupAnswers}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              🚀 Submit {currentGroup.toUpperCase()} Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}