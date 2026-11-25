export interface RegisterUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  profissao?: string | null;
  fotoPerfilUrl?: string | null;
  linkedin?: string | null;
  intuitoUso: IntuitoUsoAplicacao;
  permiteAnalisePorTerceiros: boolean;
}

export type IntuitoUsoAplicacao = 'ANALISAR_OUTRAS_PESSOAS' | 'CURIOSIDADE';

export type UpdatePerfilDTO = Omit<RegisterUsuarioDTO, 'senha'>;

export interface PerfilResponseDTO {
  success: boolean;
  data?: AuthUsuarioDTO;
  error?: string;
}

export interface LoginUsuarioDTO {
  email: string;
  senha: string;
}

export interface AlterarSenhaDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
}

export interface OperacaoAuthDTO {
  success: boolean;
  error?: string;
}

export interface SolicitarRedefinicaoSenhaDTO { email: string; }
export interface RedefinirSenhaDTO { token: string; novaSenha: string; confirmacaoNovaSenha: string; }

export interface AuthUsuarioDTO {
  id: string;
  nome: string;
  email: string;
  profissao: string | null;
  fotoPerfilUrl: string | null;
  linkedin: string | null;
  intuitoUso: IntuitoUsoAplicacao | null;
  permiteAnalisePorTerceiros: boolean;
}

export interface AuthResponseDTO {
  success: boolean;
  data?: {
    token: string;
    usuario: AuthUsuarioDTO;
  };
  error?: string;
}
