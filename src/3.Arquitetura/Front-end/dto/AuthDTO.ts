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
