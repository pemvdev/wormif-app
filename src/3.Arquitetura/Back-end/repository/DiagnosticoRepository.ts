import { Diagnostico } from '../model/Diagnostico';

export class DiagnosticoRepository {
  private diagnosticos: Diagnostico[] = [];
  private nextId = 1;

  proximoId(): number {
    return this.nextId++;
  }

  salvar(diagnostico: Diagnostico): Diagnostico {
    this.diagnosticos.push(diagnostico);
    return diagnostico;
  }

  listar(): Diagnostico[] {
    return [...this.diagnosticos];
  }
}
