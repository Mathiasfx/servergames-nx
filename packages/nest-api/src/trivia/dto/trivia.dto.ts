export class QuestionDto {
  question: string;
  options: string[];
  answer: string;
}

export class CreateTriviaDto {
  title: string;
  questions: QuestionDto[];
}

export class UpdateTriviaDto {
  title?: string;
  questions?: QuestionDto[];
}
