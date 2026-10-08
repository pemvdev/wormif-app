import type { AnaliseExternaDetalhesDTO, AnalisesExternasPaginaDTO } from '../dto/AnaliseExternaDTO';
import type { DiscussaoPaginaDTO, PalpiteDTO, SalvarPalpiteDTO, SalvarRespostaDTO } from '../dto/PalpiteDTO';
import { PalpiteRepository } from '../repository/PalpiteRepository';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { toHistoricoDTO } from './DiagnosticoService';

export class AnalisesExternasService {
  constructor(
    private readonly diagnosticoRepository: DiagnosticoRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly palpiteRepository: PalpiteRepository
  ) {}

  async podeConsultar(userId: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.buscarPorId(userId);
    return usuario?.intuitoUso === 'ANALISAR_OUTRAS_PESSOAS';
  }

  async listar(userId: string, query: string, page: number): Promise<AnalisesExternasPaginaDTO | null> {
    if (!await this.podeConsultar(userId)) return null;
    const pageSize = 20;
    const rows = await this.diagnosticoRepository.listarExternas(userId, query, pageSize + 1, (page - 1) * pageSize);
    return {
      items: rows.slice(0, pageSize).map(({ diagnostico, autorNome }) => ({ ...toHistoricoDTO(diagnostico), autorNome, temImagem: Boolean(diagnostico.imagemKey) })),
      hasMore: rows.length > pageSize
    };
  }

  async buscarPorId(id: number, userId: string): Promise<AnaliseExternaDetalhesDTO | null> {
    const row = await this.diagnosticoRepository.buscarExterna(id, userId);
    if (!row) return null;
    const [palpites, meusPalpites] = await Promise.all([
      this.palpiteRepository.listar(id, userId), this.palpiteRepository.listar(id, userId, true)
    ]);
    return { ...toHistoricoDTO(row.diagnostico), autorNome: row.autorNome,
      temImagem: Boolean(row.diagnostico.imagemKey), palpites, meuPalpite: meusPalpites[0] ?? null };
  }

  async salvarPalpite(id: number, userId: string, dto: SalvarPalpiteDTO): Promise<boolean> {
    return this.palpiteRepository.salvar(id, userId, dto);
  }

  async listarRecebidos(id: number, autorId: string): Promise<PalpiteDTO[] | null> {
    if (!await this.diagnosticoRepository.buscarPorId(id, autorId)) return null;
    return this.palpiteRepository.listarRecebidos(id, autorId);
  }

  private async podeAcessarDiscussao(id: number, userId: string): Promise<boolean> {
    const propria = await this.diagnosticoRepository.buscarPorId(id, userId);
    if (propria) return propria.status === 'concluido';
    return Boolean(await this.diagnosticoRepository.buscarExterna(id, userId));
  }

  async listarDiscussao(id: number, userId: string, cursor: number): Promise<DiscussaoPaginaDTO | null> {
    if (!await this.podeAcessarDiscussao(id, userId)) return null;
    const rows = await this.palpiteRepository.listarDiscussao(id, userId, cursor, 101);
    const items = rows.slice(0, 100);
    return { items, nextCursor: rows.length > 100 ? items[items.length - 1].sequencia : null };
  }

  async responder(id: number, userId: string, dto: SalvarRespostaDTO): Promise<boolean> {
    if (!await this.podeAcessarDiscussao(id, userId)) return false;
    return this.palpiteRepository.responder(id, userId, dto);
  }
}
