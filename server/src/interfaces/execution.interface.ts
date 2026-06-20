export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  stderr?: string;
  compilationError?: string;
  executionTime: number;
  language: string;
  status: 'compiled' | 'executed' | 'failed';
  compilationOutput?: string;
}

export interface ExecutionRequest {
  language: string;
  code: string;
  fileName?: string;
  timeout?: number;
}
