import { Request, Response } from 'express';
// 🚀 FIXED: Changed class name from GoogleGenAI to GoogleGenerativeAI
import { GoogleGenerativeAI } from '@google/generative-ai';

// 🚀 FIXED: Instantiated using the correct official constructor name
const aiEngine = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * @desc    Consult with our integrated AI Copilot for debugging or optimization
 * @route   POST /api/ai/consult
 */
export const consultAiCopilot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentCode, contextLanguage } = req.body;

    if (!prompt) {
      res.status(400).json({ message: 'Prompt parameter string is required.' });
      return;
    }

    // 🚀 FIXED: Called the core flash model using correct instance setup
    const model = aiEngine.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemInstruction = `
      You are CodeSync AI, an expert software engineering copilot embedded inside a real-time collaborative IDE.
      Provide extremely crisp, direct, production-grade code solutions. 
      Analyze the provided code snippets under the context of language: ${contextLanguage || 'javascript'}.
      Always enclose code blocks in markdown fences. Avoid conversational filler.
    `;

    const continuousPayload = `
      ${systemInstruction}
      -----------------------------------------
      CONTEXT CODE IN THE EDITOR:
      \`\`\`${contextLanguage || 'javascript'}
      ${currentCode || '// No code currently selected'}
      \`\`\`
      -----------------------------------------
      USER INSTRUCTION: ${prompt}
    `;

    const result = await model.generateContent(continuousPayload);
    const aiResponseText = result.response.text();

    res.status(200).json({ response: aiResponseText });
  } catch (error: any) {
    console.error('Gemini processing exception:', error);
    res.status(500).json({ message: 'AI Engine failed to process payload infrastructure.', error: error.message });
  }
};