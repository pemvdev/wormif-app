export interface RegisterUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  ocupacao?: string;
}

export interface LoginUsuarioDTO {
  email: string;
  senha: string;
}

export interface AuthUsuarioDTO {
  id: string;
  nome: string;
  email: string;
}

export interface AuthResponseDTO {
  success: boolean;
  data?: {
    token: string;
    usuario: AuthUsuarioDTO;
  };
  error?: string;
}
