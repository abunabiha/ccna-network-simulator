export type CcnaDomain = 
  | '1. Network Fundamentals'
  | '2. Network Access'
  | '3. IP Connectivity'
  | '4. IP Services'
  | '5. Security Fundamentals'
  | '6. Automation & Programmability';

export type CcnpDomain =
  | 'CCNP Enterprise: Advanced Routing & Services'
  | 'CCNP Enterprise: Infrastructure Security & Virtualization'
  | 'CCNP Enterprise: Automation & Programmability';

export type LabDomain = CcnaDomain | CcnpDomain;

export interface LabTaskCriterion {
  id: string;
  description: string;
  points: number; // e.g. 10
  type: 'config_check' | 'operational_check' | 'ping_check';
  targetDevice: string;
  targetInterface?: string;
  expectedProperty?: string;
  expectedValue?: any;
  pingSource?: string;
  pingDestination?: string;
  hint?: string;
  failureExplanation?: string;
}

export interface LabDefinition {
  id: string;
  title: string;
  domain: LabDomain;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  scenario: string;
  objectives: string[];
  tasks: LabTaskCriterion[];
  initialTopology: {
    devices: any[];
    links: any[];
  };
}

export interface TaskEvaluationResult {
  taskId: string;
  passed: boolean;
  earnedPoints: number;
  maxPoints: number;
  diagnostic: string;
}

export interface LabGradeReport {
  labId: string;
  totalScore: number;       // 0 - 100
  passedTasksCount: number;
  totalTasksCount: number;
  isPassed: boolean;        // Score === 100% (Strict Mastery)
  taskResults: TaskEvaluationResult[];
  gradedAt: string;
}
