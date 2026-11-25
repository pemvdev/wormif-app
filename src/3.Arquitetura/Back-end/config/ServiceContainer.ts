import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { PalpiteRepository } from '../repository/PalpiteRepository';
import { DiagnosticoService } from '../service/DiagnosticoService';
import { StorageService } from '../service/StorageService';
import { AnalisesExternasService } from '../service/AnalisesExternasService';
import { AIService } from '../service/AIService';
import { AIConfig } from './AIConfig';
import { AuthService } from '../service/AuthService';

export class ServiceContainer {
  static createAuthService(env: Env): AuthService {
    return new AuthService(env.DB);
  }

  static createStorageService(env: Env): StorageService {
    return new StorageService(env.R2_BUCKET);
  }

  static createDiagnosticoService(env: Env): DiagnosticoService {
    const repository = new DiagnosticoRepository(env.DB);
    const storage = this.createStorageService(env);
    return new DiagnosticoService(repository, storage);
  }

  static createAnalisesExternasService(env: Env): AnalisesExternasService {
    return new AnalisesExternasService(
      new DiagnosticoRepository(env.DB),
      new UsuarioRepository(env.DB),
      new PalpiteRepository(env.DB)
    );
  }

  static createAIService(env: Env): AIService {
    return new AIService(env.OPENAI_API_KEY, new AIConfig());
  }
}
