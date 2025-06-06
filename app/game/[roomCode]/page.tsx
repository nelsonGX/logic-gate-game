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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(-1));
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
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitAnswers = async () => {
    if (!studentId || answers.some(answer => answer === -1)) {
      setError('Please answer all questions before submitting');
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answers,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitResult(result);
        setIsSubmitted(true);
        fetchGameRoom(); // Refresh to see updated completion status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit answers');
      }
    } catch (err) {
      setError('Failed to submit answers');
    }
  };

  const resetQuiz = () => {
    setAnswers(new Array(questions.length).fill(-1));
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setSubmitResult(null);
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

  // Show results screen after submission
  if (isSubmitted && submitResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                {submitResult.allCorrect ? '🎉 Character Decoded!' : '❌ Decoding Failed'}
              </h1>
              <div className="text-xl text-gray-300 mb-2">
                Score: {submitResult.score} / {submitResult.totalQuestions}
              </div>
              <div className="text-lg text-indigo-400 mb-4">
                Character '{assignedChar}' at position {charPosition}: 
                <span className={`font-mono text-3xl ml-2 ${submitResult.allCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {submitResult.allCorrect ? '✓' : '✗'}
                </span>
              </div>
              {submitResult.allCorrect && (
                <div className="text-sm text-green-400">
                  Your character has been added to the escape code!
                </div>
              )}
            </div>


            {/* Question Results */}
            <div className="space-y-4 mb-8">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium">Q{index + 1}: {question.text}</h3>
                    <div className={`ml-4 px-2 py-1 rounded text-sm font-semibold ${
                      submitResult.results[index]?.isCorrect 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {submitResult.results[index]?.isCorrect ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    <div>Your answer: {question.options[answers[index]]}</div>
                    {!submitResult.results[index]?.isCorrect && (
                      <div className="text-green-400">Correct: {question.options[question.correctAnswer]}</div>
                    )}
                    {question.explanation && (
                      <div className="text-gray-400 mt-2 italic">{question.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              {!submitResult.allCorrect && (
                <button
                  onClick={resetQuiz}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = answers.every(answer => answer !== -1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">🔬 Character Decoder Challenge</h1>
          <div className="text-gray-300">
            Agent: <span className="text-indigo-400 font-semibold">{studentName}</span> | 
            Character: <span className="text-yellow-400 font-mono text-xl">{assignedChar}</span> | 
            Position: {charPosition} | Room: {gameRoom?.roomCode}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Solve logic gate circuits to decode your assigned character
          </div>
        </div>


        {/* Question Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Circuit {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{answers.filter(a => a !== -1).length} answered</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="mb-8">
            <SelectQuestion
              question={currentQuestion}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswer={answers[currentQuestionIndex] !== -1 ? answers[currentQuestionIndex] : undefined}
              disabled={false}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ← Previous
          </button>

          <div className="flex space-x-2">
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full font-semibold text-sm transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : answers[index] !== -1
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                } ${question.isFinal ? 'ring-2 ring-yellow-400' : ''}`}
                title={question.isFinal ? 'Final Question - Determines Your Bit' : `Question ${index + 1}`}
              >
                {question.isFinal ? '🔑' : index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitAnswers}
              disabled={!allAnswered}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Submit All →
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {/* Submit Button for all questions answered */}
        {allAnswered && currentQuestionIndex !== questions.length - 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={submitAnswers}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              🚀 Submit All Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}