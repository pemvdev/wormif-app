import { GoogleGenAI } from '@google/genai';
import type { AIConfig } from '../config/AIConfig';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { EstagioVida } from '../model/Diagnostico';

export class AIService {
  private ai: GoogleGenAI;
  private aiConfig: AIConfig;

  constructor(apiKey: string, aiConfig: AIConfig) {
    this.ai = new GoogleGenAI({ apiKey });
    this.aiConfig = aiConfig;
  }

  async analisarImagem(imageBase64: string, mimeType: string): Promise<DiagnosticoResponseDTO> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.aiConfig.model,
        contents: [
          { text: 'Analise esta imagem e identifique a espécie e seu estágio de vida. Responda em JSON.' },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          }
        ],
        config: {
          systemInstruction: this.aiConfig.systemInstruction,
          temperature: this.aiConfig.temperature,
          maxOutputTokens: this.aiConfig.maxOutputTokens,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          success: false,
          error: 'Não foi possível processar a resposta da IA'
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
        'desconhecido'
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
          proximoEstagio: parsed.proximoEstagio
        }
      };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar imagem'
      };
    }
  }
}
