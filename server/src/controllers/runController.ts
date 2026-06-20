import { Request, Response } from 'express';
import { dockerExecutor } from '../services/dockerExecutor';
import { ExecutionRequest } from '../interfaces/execution.interface';

export const runCode = async (req: Request, res: Response) => {
  try {
    const { language, code, fileName } = req.body as ExecutionRequest;

    // Validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        output: '',
        executionTime: 0,
      });
    }

    // Execute code
    const result = await dockerExecutor.execute({
      language,
      code,
      fileName,
      timeout: 10000,
    });

    // Return results with appropriate status code
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      output: '',
      executionTime: 0,
      language: req.body.language || 'unknown',
      status: 'failed',
    });
  }
};