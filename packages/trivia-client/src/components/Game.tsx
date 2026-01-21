/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import type { Player, Room } from '../types/game';
import { socketService } from '../services/socketService';

interface GameProps {
  room: Room;
  playerName: string;
  playerId: string;
  gameData?: any; // Add default value for gameData
  finalRanking?: Player[];
  gameEnded?: boolean;
}

export const Game: React.FC<GameProps> = ({
  room,
  playerName,
  playerId,
  finalRanking: propFinalRanking = [],
  gameEnded: propGameEnded = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [round, setRound] = useState<number>(1);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  //const [ranking, setRanking] = useState<Player[]>([]);
  const [gameEnded, setGameEnded] = useState<boolean>(propGameEnded);
  const [finalRanking, setFinalRanking] = useState<Player[]>(propFinalRanking);
  const [countdown, setCountdown] = useState<number>(0);

  // Update local state when props change
  useEffect(() => {
    setGameEnded(propGameEnded);
    setFinalRanking(propFinalRanking);
  }, [propGameEnded, propFinalRanking]);

  // Force re-render when room.currentQuestion changes
  useEffect(() => {
    // Force re-render by updating a dummy state
    setRound((prev) => prev + 0);
  }, [room.currentQuestion, room.round]);

  // Use refs to maintain stable references
  const handlersRef = useRef({
    handleNewRound: null as ((data: any) => void) | null,
    handleCountdown: null as (() => void) | null,
    handleGameStarted: null as ((_data: any) => void) | null,
    handleAnswerSubmitted: null as ((data: any) => void) | null,
    handleRankingUpdated: null as ((newRanking: Player[]) => void) | null,
    handleGameEnded: null as ((_data: any) => void) | null,
    handleGameEnding: null as ((data: any) => void) | null,
  });

  // Use room.currentQuestion directly instead of gameData.room?.currentQuestion
  const currentQuestion = room.currentQuestion || null;

  useEffect(() => {
    // Define handlers with refs to maintain stable references
    handlersRef.current.handleNewRound = (data: any) => {
      // Update round and timer
      setRound(data.round);
      setTimeLeft(data.timerSeconds);
      setSelectedAnswer('');
      setShowResult(false);

      // Force re-render by updating a dummy state
      setRound((prev) => prev + 0);
    };

    handlersRef.current.handleCountdown = () => {
      // Show countdown 3, 2, 1 for game start
      setCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
        }
      }, 1000);
    };

    handlersRef.current.handleGameStarted = (_data: any) => {
      // Game started - no special handling needed
    };

    handlersRef.current.handleAnswerSubmitted = (data: any) => {
      setIsCorrect(data.correct);
      setScore(data.score);
      setShowResult(true);
    };

    handlersRef.current.handleRankingUpdated = (newRanking: Player[]) => {
      console.log('Ranking updated:', newRanking);
      //setRanking(newRanking);
    };

    handlersRef.current.handleGameEnded = (_data: any) => {
      // Don't update state here - it's managed by App component
      // The ranking and gameEnded state come from props
    };

    handlersRef.current.handleGameEnding = (data: any) => {
      setCountdown(data.countdown);
      let count = data.countdown;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);

        // When countdown reaches 0, immediately force ranking state
        if (count === 0) {
          clearInterval(interval);
          // Force the ranking state immediately
          setGameEnded(true);
          setFinalRanking(propFinalRanking);
        }
      }, 1000);
    };

    console.log('🔧 Adding event listeners...');
    const handlers = handlersRef.current; // Copy to variable for cleanup

    socketService.on(
      'newRound',
      handlers.handleNewRound as (data: any) => void
    );
    socketService.on('countdown', handlers.handleCountdown as () => void);
    socketService.on(
      'gameStarted',
      handlers.handleGameStarted as (_data: any) => void
    );
    socketService.on(
      'answerSubmitted',
      handlers.handleAnswerSubmitted as (data: any) => void
    );
    socketService.on(
      'rankingUpdated',
      handlers.handleRankingUpdated as (data: any) => void
    );
    socketService.on(
      'gameEnded',
      handlers.handleGameEnded as (_data: any) => void
    );
    socketService.on(
      'gameEnding',
      handlers.handleGameEnding as (data: any) => void
    );

    return () => {
      socketService.off(
        'newRound',
        handlers.handleNewRound as (data: any) => void
      );
      socketService.off('countdown', handlers.handleCountdown as () => void);
      socketService.off(
        'gameStarted',
        handlers.handleGameStarted as (_data: any) => void
      );
      socketService.off(
        'answerSubmitted',
        handlers.handleAnswerSubmitted as (data: any) => void
      );
      socketService.off(
        'rankingUpdated',
        handlers.handleRankingUpdated as (data: any) => void
      );
      socketService.off(
        'gameEnded',
        handlers.handleGameEnded as (_data: any) => void
      );
      socketService.off(
        'gameEnding',
        handlers.handleGameEnding as (data: any) => void
      );
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (timeLeft > 0 && !countdown) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, countdown]);

  const handleAnswerSelect = (answer: string) => {
    if (showResult || countdown > 0) return;

    setSelectedAnswer(answer);
    socketService.submitAnswer(room.id, playerId, answer);
  };

  // Show ranking immediately if game ended or final ranking exists
  if (gameEnded || finalRanking.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            🏆 Juego Terminado!
          </h1>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
              Ranking Final
            </h2>
            <div className="space-y-3">
              {finalRanking.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    player.name === playerName
                      ? 'border-purple-500 bg-purple-50'
                      : index === 0
                      ? 'border-yellow-500 bg-yellow-50'
                      : index === 1
                      ? 'border-gray-400 bg-gray-50'
                      : index === 2
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {player.name}
                        {player.name === playerName && ' (Tú)'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-purple-600">
                        {player.score}
                      </span>
                      <span className="text-sm text-gray-600">pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              Tu puntaje final:{' '}
              <span className="font-bold text-purple-600">{score}</span> puntos
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition duration-200"
            >
              🔄 Jugar de Nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (countdown > 0) {
    // Check if this is a game ending countdown (5 seconds) or game start countdown (3 seconds)
    // Game ending countdown is always 5 seconds, game start is always 3 seconds
    const isGameEndingCountdown =
      countdown === 5 ||
      countdown === 4 ||
      countdown === 3 ||
      countdown === 2 ||
      countdown === 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl font-bold text-white animate-pulse mb-4">
            {countdown}
          </div>
          <p className="text-2xl text-white">
            {isGameEndingCountdown
              ? countdown === 5
                ? 'El juego termina...'
                : countdown === 4
                ? 'Calculando resultados...'
                : countdown === 3
                ? 'Terminando juego...'
                : countdown === 2
                ? '¡Casi listo!'
                : '¡Mira el ranking!'
              : countdown === 3
              ? 'Prepárate...'
              : countdown === 2
              ? 'Listos...'
              : '¡El juego comienza!'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Esperando la próxima pregunta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold text-gray-800">
              Ronda {round}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg font-semibold text-purple-600">
                Puntaje: {score}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  timeLeft <= 5
                    ? 'bg-red-100 text-red-800 animate-pulse'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                ⏱️ {timeLeft}s
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const letter = String.fromCharCode(65 + index); // A, B, C, D

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    showResult
                      ? isSelected && isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isSelected && !isCorrect
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        showResult
                          ? isSelected && isCorrect
                            ? 'bg-green-500 text-white'
                            : isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                          : isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-lg font-medium text-gray-800">
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Message
          {showResult && (
            <div
              className={`mt-6 p-4 rounded-lg text-center ${
                isCorrect
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <p className="text-lg font-semibold">
                {isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
              </p>
              {!isCorrect && currentQuestion.correctAnswer && (
                <p className="text-sm mt-1">
                  La respuesta correcta era: {currentQuestion.correctAnswer}
                </p>
              )}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
