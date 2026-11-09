export type AIProvider = 'gemini' | 'anthropic' | 'openai';

export interface RepositoryContext {
  owner: string;
  repo: string;
  installationId: number;
  defaultBranch: string;
  cloneUrl: string;
}

export interface IssueContext {
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
}

export interface DiagnosisReport {
  issueSummary: string;
  rootCauseAnalysis: string;
  affectedFiles: string[];
  reproductionStrategy: string;
  proposedFixSummary: string;
}

export interface ReproductionTest {
  testFilePath: string;
  testFileContent: string;
  testFramework: 'vitest' | 'jest' | 'pytest' | 'mocha' | 'custom';
  initialFailureOutput?: string;
}

export interface CodePatch {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  explanation: string;
}

export interface CureResult {
  success: boolean;
  diagnosis: DiagnosisReport;
  reproductionTest?: ReproductionTest;
  patches: CodePatch[];
  testOutput: string;
  prUrl?: string;
  prNumber?: number;
  errorMessage?: string;
}
