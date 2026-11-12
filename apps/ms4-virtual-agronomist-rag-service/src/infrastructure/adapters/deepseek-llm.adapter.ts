import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LlmCompletionPort,
  LlmCompletionResult,
} from '../../application/ports/out/llm-completion.port';

@Injectable()
export class DeepSeekLlmAdapter implements LlmCompletionPort {
  private readonly logger = new Logger(DeepSeekLlmAdapter.name);
  private readonly baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  private readonly model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  private readonly apiKey = (process.env.DEEPSEEK_API_KEY || '').trim();

  public async generateCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
    fallbackContent?: string;
  }): Promise<LlmCompletionResult> {
    const startMs = Date.now();

    const isKeyConfigured =
      this.apiKey.length >= 12 &&
      !this.apiKey.includes('tu_api_key') &&
      !this.apiKey.includes('placeholder');

    if (!isKeyConfigured) {
      this.logger.warn(
        'DEEPSEEK_API_KEY no configurada en entorno. Empleando sintetizador RAG estructurado local con fragmentos pgvector + métricas MS1/MS2/MS3.',
      );
      return {
        content:
          params.fallbackContent ??
          'Diagnóstico generado con base en el corpus agronómico local de sandía y telemetría de la parcela.',
        modelUsed: `${this.model} (local-rag-synthesizer)`,
        elapsedMs: Date.now() - startMs,
      };
    }

    try {
      const client = new OpenAI({
        baseURL: this.baseUrl,
        apiKey: this.apiKey,
        timeout: 18000,
      });

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        max_tokens: params.maxTokens ?? 1400,
        temperature: params.temperature ?? 0.25,
      });

      const content =
        response.choices?.[0]?.message?.content?.trim() ||
        params.fallbackContent ||
        'Sin respuesta del modelo.';

      return {
        content,
        modelUsed: this.model,
        elapsedMs: Date.now() - startMs,
      };
    } catch (err) {
      this.logger.warn(
        `Error invocando DeepSeek API (${(err as Error).message}). Activando respuesta RAG estructurada de respaldo.`,
      );
      return {
        content:
          params.fallbackContent ??
          'Diagnóstico generado a partir de los fragmentos recuperados en pgvector y telemetría de la parcela.',
        modelUsed: `${this.model} (fallback-rag-synthesizer)`,
        elapsedMs: Date.now() - startMs,
      };
    }
  }
}
