import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import { Diagnostico } from '../model/Diagnostico';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';

export class DiagnosticoService {
  private diagnosticoRepository: DiagnosticoRepository;

  constructor(diagnosticoRepository: DiagnosticoRepository) {
    this.diagnosticoRepository = diagnosticoRepository;
  }

  async registrar(data: NonNullable<DiagnosticoResponseDTO['data']>): Promise<void> {
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
      data.habitat
    );
    diagnostico.processar();
    await this.diagnosticoRepository.salvar(diagnostico);
  }
}
