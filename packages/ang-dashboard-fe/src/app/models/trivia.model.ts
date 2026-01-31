export interface TriviaQuestion {
  id?: string;
  question: string;
  options: string[];
  answer: string;
}

export interface Trivia {
  id: string;
  name?: string; // ✅ Hacer opcional
  description?: string;
  questions: TriviaQuestion[];
  createdAt?: Date;
  updatedAt?: Date;
  totalQuestions?: number;
}
