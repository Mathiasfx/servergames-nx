export interface Player {
  id: string;
  name: string;
  score: number;
  isAdmin: boolean;
  answeredAt?: Date;
  answeredCorrect?: boolean;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Room {
  id: string;
  triviaId: string;
  players: Player[];
  isActive: boolean;
  round: number;
  questions: Question[];
  currentQuestion?: Question;
}

export interface GameMessage {
  type: 'countdown' | 'newRound' | 'gameStarted' | 'gameEnded' | 'answerSubmitted' | 'rankingUpdated' | 'playerJoined' | 'playerLeft' | 'roomState' | 'gameEnding';
  data: any;
}
