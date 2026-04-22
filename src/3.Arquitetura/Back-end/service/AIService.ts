import OpenAI from 'openai';
import type { AIConfig } from '../config/AIConfig';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { EstagioVida } from '../model/Diagnostico';

export class AIService {
  private openai: OpenAI;
  private aiConfig: AIConfig;

  constructor(apiKey: string, aiConfig: AIConfig) {
    this.openai = new OpenAI({
      apiKey,
      fetch: globalThis.fetch.bind(globalThis),
    });
    this.aiConfig = aiConfig;
  }

  async analisarImagem(imageBase64: string, mimeType: string): Promise<DiagnosticoResponseDTO> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.aiConfig.model,
        messages: [
          { role: 'system', content: this.aiConfig.systemInstruction },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e identifique a espécie e seu estágio de vida. Responda apenas com um objeto JSON válido conforme o esquema indicado nas instruções do sistema.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: this.aiConfig.temperature,
        max_tokens: this.aiConfig.maxOutputTokens,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          success: false,
          error: 'Não foi possível processar a resposta da IA',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const validEstagios: EstagioVida[] = [
        'ovo',
        'larva',
        'ninfa',
        'pupa',
        'juvenil',
        'subadulto',
        'adulto',
        'desconhecido',
      ];
      const estagioVida = validEstagios.includes(parsed.estagioVida)
        ? parsed.estagioVida
        : 'desconhecido';

      return {
        success: true,
        data: {
          especie: parsed.especie || 'Não identificado',
          nomeComum: parsed.nomeComum || 'Não identificado',
          estagioVida,
          nivelConfianca: Math.min(1, Math.max(0, parsed.nivelConfianca || 0)),
          descricao: parsed.descricao || '',
          caracteristicas: Array.isArray(parsed.caracteristicas) ? parsed.caracteristicas : [],
          habitat: parsed.habitat || '',
          cicloDeVida: parsed.cicloDeVida || '',
          proximoEstagio: parsed.proximoEstagio,
        },
      };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar imagem',
      };
    }
  }
}
