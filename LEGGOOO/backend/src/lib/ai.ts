/**
 * AI Service Library
 * Handles AI chat and code completion functionality
 * Supports multiple providers: OpenAI, Anthropic
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { Database } from '../types/database.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// AI Provider configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIContext {
  workspaceId: string;
  fileId?: string;
  fileName?: string;
  fileContent?: string;
  selectedCode?: string;
  cursorPosition?: { line: number; column: number };
  relatedFiles?: Array<{ path: string; content: string }>;
}

interface AIResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface CompletionResponse {
  suggestions: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * System prompt for code assistance
 */
const SYSTEM_PROMPT = `You are an expert coding assistant integrated into a collaborative IDE called LEGGOOO. 
Your role is to help developers write, understand, and debug code.

Guidelines:
- Provide clear, concise explanations
- Include code examples when helpful
- Consider the context of the current file and workspace
- Suggest best practices and improvements
- Format code blocks with appropriate language tags
- Be helpful but not overly verbose

When given file context, consider:
- The programming language being used
- The project structure and patterns
- Related files and dependencies`;

/**
 * Build context prompt from workspace context
 */
function buildContextPrompt(context: AIContext): string {
  const parts: string[] = [];

  if (context.fileName && context.fileContent) {
    parts.push(`Current file: ${context.fileName}`);
    parts.push('```');
    parts.push(context.fileContent.slice(0, 4000)); // Limit content size
    parts.push('```');
  }

  if (context.selectedCode) {
    parts.push(`\nSelected code:\n\`\`\`\n${context.selectedCode}\n\`\`\``);
  }

  if (context.cursorPosition) {
    parts.push(`\nCursor at line ${context.cursorPosition.line}, column ${context.cursorPosition.column}`);
  }

  if (context.relatedFiles && context.relatedFiles.length > 0) {
    parts.push('\nRelated files:');
    for (const file of context.relatedFiles.slice(0, 3)) {
      parts.push(`\n--- ${file.path} ---`);
      parts.push('```');
      parts.push(file.content.slice(0, 1000));
      parts.push('```');
    }
  }

  return parts.join('\n');
}

/**
 * Generate hash for prompt to track unique requests
 */
function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 32);
}

/**
 * Log AI request to database
 */
async function logRequest(
  userId: string, 
  workspaceId: string, 
  action: string, 
  prompt: string,
  tokensUsed: number
): Promise<void> {
  try {
    await supabase.from('ai_requests').insert({
      user_id: userId,
      workspace_id: workspaceId,
      prompt_hash: hashPrompt(prompt),
      action,
      tokens_used: tokensUsed,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  } catch (err) {
    console.error('Failed to log AI request:', err);
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  return {
    message: data.choices[0]?.message?.content || '',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: options.maxTokens || 2048,
      system: systemMessage,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json() as {
    content: Array<{ text: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  return {
    message: data.content[0]?.text || '',
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    },
  };
}

/**
 * Get AI provider based on configuration
 */
function getProvider(): 'openai' | 'anthropic' {
  if (OPENAI_API_KEY) return 'openai';
  if (ANTHROPIC_API_KEY) return 'anthropic';
  throw new Error('No AI provider configured');
}

/**
 * Chat with AI assistant
 */
export async function chat(
  userId: string,
  workspaceId: string,
  userMessage: string,
  context: AIContext,
  conversationHistory: ChatMessage[] = []
): Promise<AIResponse> {
  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  // Add context if available
  const contextPrompt = buildContextPrompt(context);
  const fullMessage = contextPrompt 
    ? `[Context]\n${contextPrompt}\n\n[Question]\n${userMessage}`
    : userMessage;
  
  messages.push({ role: 'user', content: fullMessage });

  // Call AI provider
  const provider = getProvider();
  const response = provider === 'openai' 
    ? await callOpenAI(messages) 
    : await callAnthropic(messages);

  // Log the request
  await logRequest(userId, workspaceId, 'chat', fullMessage, response.usage?.totalTokens || 0);

  return response;
}

/**
 * Get code completions
 */
export async function getCompletions(
  userId: string,
  workspaceId: string,
  prefix: string,
  suffix: string,
  language: string,
  _context: AIContext
): Promise<CompletionResponse> {
  const prompt = `Complete the following ${language} code. Only provide the completion, no explanation.

Before cursor:
\`\`\`${language}
${prefix}
\`\`\`

After cursor:
\`\`\`${language}
${suffix}
\`\`\`

Provide up to 3 completion suggestions, one per line.`;

  const messages: ChatMessage[] = [
    { 
      role: 'system', 
      content: 'You are a code completion assistant. Provide only code completions, no explanations. Each suggestion should be on its own line.' 
    },
    { role: 'user', content: prompt },
  ];

  const provider = getProvider();
  const response = provider === 'openai'
    ? await callOpenAI(messages, { maxTokens: 500, temperature: 0.3 })
    : await callAnthropic(messages, { maxTokens: 500, temperature: 0.3 });

  // Parse suggestions from response
  const suggestions = response.message
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('```'))
    .slice(0, 3);

  // Log the request
  await logRequest(userId, workspaceId, 'completion', prompt, response.usage?.totalTokens || 0);

  return {
    suggestions,
    usage: response.usage,
  };
}

/**
 * Explain code selection
 */
export async function explainCode(
  userId: string,
  workspaceId: string,
  code: string,
  language: string
): Promise<AIResponse> {
  const prompt = `Explain the following ${language} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  const provider = getProvider();
  const response = provider === 'openai' 
    ? await callOpenAI(messages) 
    : await callAnthropic(messages);

  await logRequest(userId, workspaceId, 'explain', prompt, response.usage?.totalTokens || 0);

  return response;
}

/**
 * Suggest code improvements/refactoring
 */
export async function suggestImprovements(
  userId: string,
  workspaceId: string,
  code: string,
  language: string
): Promise<AIResponse> {
  const prompt = `Suggest improvements and refactoring for the following ${language} code. Include specific code changes:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  const provider = getProvider();
  const response = provider === 'openai' 
    ? await callOpenAI(messages) 
    : await callAnthropic(messages);

  await logRequest(userId, workspaceId, 'improve', prompt, response.usage?.totalTokens || 0);

  return response;
}

/**
 * Fix code errors
 */
export async function fixCode(
  userId: string,
  workspaceId: string,
  code: string,
  language: string,
  error?: string
): Promise<AIResponse> {
  let prompt = `Fix the following ${language} code`;
  if (error) {
    prompt += `. The error is: ${error}`;
  }
  prompt += `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the corrected code and a brief explanation of what was wrong.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  const provider = getProvider();
  const response = provider === 'openai' 
    ? await callOpenAI(messages) 
    : await callAnthropic(messages);

  await logRequest(userId, workspaceId, 'fix', prompt, response.usage?.totalTokens || 0);

  return response;
}

/**
 * Generate code from description
 */
export async function generateCode(
  userId: string,
  workspaceId: string,
  description: string,
  language: string,
  context: AIContext
): Promise<AIResponse> {
  const contextPrompt = buildContextPrompt(context);
  let prompt = `Generate ${language} code for the following:\n\n${description}`;
  
  if (contextPrompt) {
    prompt = `[Context]\n${contextPrompt}\n\n[Request]\n${prompt}`;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  const provider = getProvider();
  const response = provider === 'openai' 
    ? await callOpenAI(messages) 
    : await callAnthropic(messages);

  await logRequest(userId, workspaceId, 'generate', prompt, response.usage?.totalTokens || 0);

  return response;
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return !!(OPENAI_API_KEY || ANTHROPIC_API_KEY);
}

/**
 * Get current AI provider name
 */
export function getProviderName(): string {
  if (OPENAI_API_KEY) return 'OpenAI (GPT-4o-mini)';
  if (ANTHROPIC_API_KEY) return 'Anthropic (Claude 3 Haiku)';
  return 'None';
}
