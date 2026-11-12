export const LLM_COMPLETION_PORT = Symbol('LLM_COMPLETION_PORT');

export interface LlmCompletionResult {
  content: string;
  modelUsed: string;
  elapsedMs: number;
}

export interface LlmCompletionPort {
  generateCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
    fallbackContent?: string;
  }): Promise<LlmCompletionResult>;
}
