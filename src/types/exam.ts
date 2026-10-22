import { CcnaDomain } from './lab';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'drag_drop' | 'simlet';

export interface ExamOption {
  id: string;
  text: string;
}

export interface DragItem {
  id: string;
  text: string;
}

export interface DropTarget {
  id: string;
  label: string;
  correctItemId: string;
}

export interface SimletTask {
  id: string;
  description: string;
  expectedKey: string;
  expectedValue: any;
}

export interface SimletConfig {
  deviceHostname: string;
  deviceType: 'router' | 'switch';
  tasks: SimletTask[];
}

export interface ExamQuestion {
  id: string;
  domain: string;
  type: QuestionType;
  prompt: string;
  options?: ExamOption[];
  correctAnswer?: string[]; // array of option IDs for single/multiple choice
  dragItems?: DragItem[];
  dropTargets?: DropTarget[];
  simlet?: SimletConfig;
  explanation: string;
  exhibitTitle?: string;
  exhibitContent?: string; // Text / CLI output or ASCII diagram
  requiredSelections?: number; // e.g. 2 for "Choose two"
}

export interface CandidateAnswer {
  questionId: string;
  selectedOptions: string[];
  dragDropMatches?: Record<string, string>; // targetId -> itemId
  simletCommands?: string[];
  isMarkedForReview: boolean;
}

export interface DomainScore {
  domain: string;
  correctCount: number;
  totalCount: number;
  percentage: number;
}

export interface ExamSuite {
  id: string;
  code: string;
  title: string;
  track: 'CCNA' | 'CCNP';
  timeLimitMinutes: number;
  passingScore: number;
  domains: string[];
  questions: ExamQuestion[];
}

export interface PearsonVueScoreReport {
  candidateName: string;
  examCode: string;
  examDate: string;
  passingScore: number;    // e.g. 825
  candidateScore: number;  // scale 300 - 1000
  verdict: 'PASS' | 'FAIL';
  domainScores: DomainScore[];
  totalCorrect: number;
  totalQuestions: number;
}
