import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';
import { Diagnostico } from '../model/Diagnostico';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { StorageService } from './StorageService';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';

export class DiagnosticoService {
  private diagnosticoRepository: DiagnosticoRepository;

  constructor(diagnosticoRepository: DiagnosticoRepository, private readonly storageService?: StorageService) {
    this.diagnosticoRepository = diagnosticoRepository;
  }

  async registrar(
    userId: string,
    data: NonNullable<DiagnosticoResponseDTO['data']>,
    imagem?: UploadImagemDTO
  ): Promise<Diagnostico> {
    const diagnostico = new Diagnostico(
      0,
      new Date().toISOString(),
      'processando',
      data.nivelConfianca,
      data.diagnosticoBack,
      false,
      data.especie,
      data.nomeComum,
      data.descricao,
      data.caracteristicas,
      data.habitat,
      userId
    );
    diagnostico.processar();
    if (imagem) {
      if (!this.storageService) throw new Error('Armazenamento de imagens não configurado');
      diagnostico.imagemKey = await this.storageService.salvarImagem(imagem);
    }
    try {
      return await this.diagnosticoRepository.salvar(diagnostico);
    } catch (error) {
      if (diagnostico.imagemKey) await this.storageService?.excluirImagem(diagnostico.imagemKey);
      throw error;
    }
  }

  async listar(userId: string): Promise<DiagnosticoHistoricoDTO[]> {
    const diagnosticos = await this.diagnosticoRepository.listarPorUsuario(userId);
    return diagnosticos.map(({ diagnostico, totalRespostas }) => ({ ...toHistoricoDTO(diagnostico), totalRespostas }));
  }

  async buscarPorId(id: number, userId: string): Promise<DiagnosticoHistoricoDTO | null> {
    const diagnostico = await this.diagnosticoRepository.buscarPorId(id, userId);
    return diagnostico ? toHistoricoDTO(diagnostico) : null;
  }

  async atualizarLocalizacao(id: number, userId: string, latitude: number, longitude: number, label: string): Promise<boolean> {
    return this.diagnosticoRepository.atualizarLocalizacao(id, userId, latitude, longitude, label);
  }

  async obterImagem(id: number, userId: string): Promise<{ body: ReadableStream; contentType: string } | null> {
    const own = await this.diagnosticoRepository.buscarPorId(id, userId);
    const external = own ? null : await this.diagnosticoRepository.buscarExterna(id, userId);
    const key = own?.imagemKey ?? external?.diagnostico.imagemKey;
    if (!key || !this.storageService) return null;
    return this.storageService.buscarImagem(key);
  }

  async excluir(id: number, userId: string): Promise<boolean> {
    const diagnostico = await this.diagnosticoRepository.buscarPorId(id, userId);
    if (!diagnostico) return false;

    const removido = await this.diagnosticoRepository.excluir(id, userId);
    if (removido && diagnostico.imagemKey && this.storageService) {
      await this.storageService.excluirImagem(diagnostico.imagemKey);
    }
    return removido;
  }
}

export function toHistoricoDTO(diagnostico: Diagnostico): DiagnosticoHistoricoDTO {
  return {
    id: diagnostico.id,
    data: diagnostico.data,
    status: diagnostico.status,
    nivelConfianca: diagnostico.nivelConfianca,
    diagnosticoBack: diagnostico.diagnosticoBack,
    especie: diagnostico.especie,
    nomeComum: diagnostico.nomeComum,
    descricao: diagnostico.descricao,
    caracteristicas: diagnostico.caracteristicas,
    habitat: diagnostico.habitat,
    validadoPorEspecialista: diagnostico.validadoPorEspecialista,
    latitude: diagnostico.latitude,
    longitude: diagnostico.longitude,
    localizacaoLabel: diagnostico.localizacaoLabel
  };
}
