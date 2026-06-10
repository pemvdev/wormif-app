import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';
import { Diagnostico } from '../model/Diagnostico';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';

export class DiagnosticoService {
  private diagnosticoRepository: DiagnosticoRepository;

  constructor(diagnosticoRepository: DiagnosticoRepository) {
    this.diagnosticoRepository = diagnosticoRepository;
  }

  async registrar(
    userId: string,
    data: NonNullable<DiagnosticoResponseDTO['data']>
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
    return this.diagnosticoRepository.salvar(diagnostico);
  }

  async listar(userId: string): Promise<DiagnosticoHistoricoDTO[]> {
    const diagnosticos = await this.diagnosticoRepository.listarPorUsuario(userId);
    return diagnosticos.map((item) => this.toHistoricoDTO(item));
  }

  async buscarPorId(id: number, userId: string): Promise<DiagnosticoHistoricoDTO | null> {
    const diagnostico = await this.diagnosticoRepository.buscarPorId(id, userId);
    return diagnostico ? this.toHistoricoDTO(diagnostico) : null;
  }

  async excluir(id: number, userId: string): Promise<boolean> {
    return this.diagnosticoRepository.excluir(id, userId);
  }

  private toHistoricoDTO(diagnostico: Diagnostico): DiagnosticoHistoricoDTO {
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
      validadoPorEspecialista: diagnostico.validadoPorEspecialista
    };
  }
}
