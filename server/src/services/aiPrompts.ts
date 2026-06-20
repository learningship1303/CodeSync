export const generateExplainPrompt = (code: string, language: string): string => {
  return `Please explain the following ${language} code in simple terms:

\`\`\`${language}
${code}
\`\`\`

Focus on what it does and how it works.`;
};

export const generateFixBugsPrompt = (code: string, language: string): string => {
  return `Please identify and fix any bugs in this ${language} code:

\`\`\`${language}
${code}
\`\`\`

List the bugs found and provide the corrected code.`;
};

export const generateOptimizePrompt = (code: string, language: string): string => {
  return `Please optimize this ${language} code for performance and readability:

\`\`\`${language}
${code}
\`\`\`

Suggest improvements and explain why they would be better.`;
};

export const generateFunctionPrompt = (description: string, language: string): string => {
  return `Generate a ${language} function based on this description:

${description}

Provide clean, well-structured code with comments.`;
};

export const generateCommentsPrompt = (code: string, language: string): string => {
  return `Add clear comments and docstrings to this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Return the code with comprehensive comments.`;
};

export const generateRefactorPrompt = (code: string, language: string): string => {
  return `Refactor this ${language} code to improve structure and maintainability:

\`\`\`${language}
${code}
\`\`\`

Explain what you changed and why.`;
};

export const generateComplexityPrompt = (code: string, language: string): string => {
  return `Analyze the time and space complexity of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide Big O notation analysis and suggestions for optimization if applicable.`;
};

export const generateSecurityReviewPrompt = (code: string, language: string): string => {
  return `Perform a security review of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Identify potential security vulnerabilities and suggest fixes.`;
};

export default {
  generateExplainPrompt,
  generateFixBugsPrompt,
  generateOptimizePrompt,
  generateFunctionPrompt,
  generateCommentsPrompt,
  generateRefactorPrompt,
  generateComplexityPrompt,
  generateSecurityReviewPrompt,
};
