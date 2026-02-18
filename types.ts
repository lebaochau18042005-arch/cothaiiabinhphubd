
// types.ts

export type Page = 'dashboard' | 'matrix-creator' | 'exam-generator' | 'classroom-management' | 'student-zone' | 'form-builder' | 'ai-grader' | 'map-tool';

export type QuestionFormat = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
export type CognitiveLevel = 'knowledge' | 'comprehension' | 'application';
export type CompetencyCode = 'NL1' | 'NL2' | 'NL3' | 'NL4';

export type CognitiveLevels<T = number> = Record<CognitiveLevel, T>;

export type QuestionTypeCounts = Record<QuestionFormat, number>;

export interface MatrixRow {
  id: string;
  topic: string;
  content: string;
  competencyCodes: CompetencyCode[];
  levels: CognitiveLevels<QuestionTypeCounts>;
}

export type PointSettings = Record<QuestionFormat, CognitiveLevels>;

export interface MatrixData {
  matrixName: string;
  creatorName: string;
  subject: string;
  grade: string;
  rows: MatrixRow[];
  points: PointSettings;
}

export interface SavedMatrix extends MatrixData {
  id: string;
  savedAt: string;
  outcomes?: Record<string, Partial<CognitiveLevels<string>>>;
}

export interface BaseQuestion {
  points?: number;
  grading_scheme?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct_answer: string;
}

export interface TrueFalseStatement {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
  is_true: boolean;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  context: string;
  statements: TrueFalseStatement[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  question: string;
  correct_answer: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  question: string;
}

export type ExamQuestion = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion | EssayQuestion;

export interface SavedExam {
  id: string;
  name: string;
  savedAt: string;
  questions: ExamQuestion[];
  matrixContext?: MatrixData;
}

export interface SavedQuizQuestion extends MultipleChoiceQuestion {
  userAnswer: string;
}

export interface AIGradeResult {
  score: number;
  feedback: string;
}

export interface SelectedTopic {
  grade: string;
  chapter: string;
  unit: string;
}

// GAME TYPES
export interface GameSession {
  id: string;
  gameName: string;
  topic: SelectedTopic;
  status: 'lobby' | 'playing' | 'finished';
  createdAt: string;
  questions: ExamQuestion[];
  settings: {
    timePerQuestion: number; // giây
    basePoints: number;
  };
}

export interface Player {
  id: string;
  name: string;
  className: string; // Lớp
  score: number;
  progress: number;
  answers: Record<number, { isCorrect: boolean; timeTaken: number }>;
  finishedAt?: string;
}

export interface GameHistoryRecord {
  sessionId: string;
  gameName: string;
  topicName: string;
  date: string;
  players: Player[];
  aiAnalysis?: string;
}
