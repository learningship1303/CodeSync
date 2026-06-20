import { exec, execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { ExecutionResult, ExecutionRequest } from '../interfaces/execution.interface';
import { detectLanguageFromExtension, LanguageConfig } from './languageDetector';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const TEMP_DIR = path.join(process.cwd(), 'temp_execution');
const EXECUTION_TIMEOUT = 10000; // 10 seconds

export class DockerExecutor {
  private ensureTempDir(): void {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }

  private generateFileName(language: string): string {
    const ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java';
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  }

  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.ensureTempDir();

    try {
      // Detect language
      const languageConfig = detectLanguageFromExtension(request.language);
      if (!languageConfig) {
        return {
          success: false,
          output: '',
          error: `Language '${request.language}' is not supported. Supported: javascript, python, cpp, java, typescript`,
          executionTime: Date.now() - startTime,
          language: request.language,
          status: 'failed',
        };
      }

      // Generate temp file
      const requestedFileName = request.fileName ? path.basename(request.fileName) : '';
      const fileName = requestedFileName || this.generateFileName(languageConfig.language);
      const filePath = path.join(TEMP_DIR, fileName);

      // Write code to file
      fs.writeFileSync(filePath, request.code);

      let result: ExecutionResult;

      if (languageConfig.hasCompilation) {
        result = await this.executeCompiled(languageConfig, filePath, startTime);
      } else {
        result = await this.executeInterpreted(languageConfig, filePath, startTime);
      }

      // Cleanup
      this.cleanupFile(filePath);

      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime,
        language: request.language,
        status: 'failed',
      };
    }
  }

  private async executeInterpreted(
    config: LanguageConfig,
    filePath: string,
    startTime: number
  ): Promise<ExecutionResult> {
    const command = config.runCommand.replace('{file}', filePath);

    try {
      const { stdout, stderr } = await Promise.race([
        execAsync(command, { timeout: EXECUTION_TIMEOUT, maxBuffer: 10 * 1024 * 1024 }),
        new Promise<{ stdout: string; stderr: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout')), EXECUTION_TIMEOUT)
        ),
      ]);

      return {
        success: true,
        output: stdout,
        stderr: stderr || undefined,
        executionTime: Date.now() - startTime,
        language: config.language,
        status: 'executed',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Execution failed';
      return {
        success: false,
        output: '',
        error: errorMsg,
        executionTime: Date.now() - startTime,
        language: config.language,
        status: 'failed',
      };
    }
  }

  private async executeCompiled(
    config: LanguageConfig,
    filePath: string,
    startTime: number
  ): Promise<ExecutionResult> {
    if (!config.compileCommand) {
      return {
        success: false,
        output: '',
        error: 'Compilation not configured for this language',
        executionTime: Date.now() - startTime,
        language: config.language,
        status: 'failed',
      };
    }

    const outputFile = filePath.replace(/\.[^.]+$/, '');
    const compileCmd = config.compileCommand.replace('{file}', filePath).replace('{output}', outputFile);

    try {
      // Compile with timeout
      const { stdout: compileStdout, stderr: compileStderr } = await Promise.race([
        execAsync(compileCmd, { timeout: EXECUTION_TIMEOUT, maxBuffer: 10 * 1024 * 1024 }),
        new Promise<{ stdout: string; stderr: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Compilation timeout')), EXECUTION_TIMEOUT)
        ),
      ]);

      // Check if output exists
      if (!fs.existsSync(outputFile)) {
        return {
          success: false,
          output: '',
          compilationError: compileStderr || 'Compilation failed: output file not created',
          compilationOutput: compileStdout,
          executionTime: Date.now() - startTime,
          language: config.language,
          status: 'failed',
        };
      }

      // Run compiled binary
      const runCmd = config.runCommand
        .replace('{file}', filePath)
        .replace('{output}', outputFile)
        .replace('{classname}', path.basename(filePath, '.java'));

      const { stdout: runStdout, stderr: runStderr } = await Promise.race([
        execAsync(runCmd, { timeout: EXECUTION_TIMEOUT, maxBuffer: 10 * 1024 * 1024 }),
        new Promise<{ stdout: string; stderr: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout')), EXECUTION_TIMEOUT)
        ),
      ]);

      // Cleanup compiled output
      this.cleanupFile(outputFile);

      return {
        success: true,
        output: runStdout,
        stderr: runStderr || undefined,
        compilationOutput: compileStdout,
        executionTime: Date.now() - startTime,
        language: config.language,
        status: 'executed',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Compilation/Execution failed';

      // Cleanup compiled output
      this.cleanupFile(outputFile);

      return {
        success: false,
        output: '',
        compilationError: errorMsg,
        executionTime: Date.now() - startTime,
        language: config.language,
        status: 'failed',
      };
    }
  }
}

export const dockerExecutor = new DockerExecutor();
