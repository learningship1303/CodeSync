import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as aiPrompts from '../services/aiPrompts';

const aiEngine = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.GEMINI_API_KEY || '');

const systemInstruction = `You are CodeSync AI, an expert software engineering copilot embedded inside a collaborative IDE.
Provide crisp, direct, production-grade solutions. Always enclose code blocks in markdown fences.
Be concise but thorough. Avoid unnecessary explanations.`;

const callAiModel = async (prompt: string, contextLanguage: string = 'javascript'): Promise<string> => {
  const model = aiEngine.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const fullPrompt = `${systemInstruction}\n\nLanguage: ${contextLanguage}\n\n${prompt}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
};

export const consultAiCopilot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentCode, contextLanguage } = req.body;

    if (!prompt) {
      res.status(400).json({ message: 'Prompt parameter is required.' });
      return;
    }

    const model = aiEngine.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const continuousPayload = `
      ${systemInstruction}
      -----------------------------------------
      CONTEXT CODE:
      \`\`\`${contextLanguage || 'javascript'}
      ${currentCode || '// No code provided'}
      \`\`\`
      -----------------------------------------
      USER INSTRUCTION: ${prompt}
    `;

    const result = await model.generateContent(continuousPayload);
    const aiResponseText = result.response.text();

    res.status(200).json({ response: aiResponseText });
  } catch (error: any) {
    console.error('AI error:', error);
    res.status(500).json({ message: 'AI processing failed', error: error.message });
  }
};

// ============== AI Copilot Capabilities ==============

export const explainCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateExplainPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'explain' });
  } catch (error: any) {
    console.error('Explain error:', error);
    res.status(500).json({ message: 'Failed to explain code', error: error.message });
  }
};

export const fixBugs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateFixBugsPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'fix-bugs' });
  } catch (error: any) {
    console.error('Fix bugs error:', error);
    res.status(500).json({ message: 'Failed to identify bugs', error: error.message });
  }
};

export const optimizeCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateOptimizePrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'optimize' });
  } catch (error: any) {
    console.error('Optimize error:', error);
    res.status(500).json({ message: 'Failed to optimize code', error: error.message });
  }
};

export const generateFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, language = 'javascript' } = req.body;

    if (!description) {
      res.status(400).json({ message: 'Function description is required.' });
      return;
    }

    const prompt = aiPrompts.generateFunctionPrompt(description, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'generate-function' });
  } catch (error: any) {
    console.error('Generate function error:', error);
    res.status(500).json({ message: 'Failed to generate function', error: error.message });
  }
};

export const generateComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateCommentsPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'generate-comments' });
  } catch (error: any) {
    console.error('Generate comments error:', error);
    res.status(500).json({ message: 'Failed to generate comments', error: error.message });
  }
};

export const refactorCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateRefactorPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'refactor' });
  } catch (error: any) {
    console.error('Refactor error:', error);
    res.status(500).json({ message: 'Failed to refactor code', error: error.message });
  }
};

export const analyzeComplexity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateComplexityPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'complexity-analysis' });
  } catch (error: any) {
    console.error('Complexity analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze complexity', error: error.message });
  }
};

export const securityReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Code is required.' });
      return;
    }

    const prompt = aiPrompts.generateSecurityReviewPrompt(code, language);
    const response = await callAiModel(prompt, language);

    res.status(200).json({ response, capability: 'security-review' });
  } catch (error: any) {
    console.error('Security review error:', error);
    res.status(500).json({ message: 'Failed to perform security review', error: error.message });
  }
};