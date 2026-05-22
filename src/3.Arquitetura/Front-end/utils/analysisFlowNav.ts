export const ANALYSIS_FLOW_MESSAGES = {
  needUploadForIdentificacao:
    'Envie uma imagem na etapa de Upload antes de acessar a Identificação por IA.',
  needUploadForResultado:
    'Envie uma imagem na etapa de Upload antes de acessar os Resultados.',
  needIdentificacaoForResultado:
    'Conclua a identificação por IA antes de acessar os Resultados.'
} as const;

export type AnalysisFlowPath = '/upload' | '/identificacao' | '/resultado';

export function getAnalysisFlowBlockReason(
  path: AnalysisFlowPath,
  hasPending: boolean,
  hasResultado: boolean
): string | null {
  if (path === '/identificacao' && !hasPending) {
    return ANALYSIS_FLOW_MESSAGES.needUploadForIdentificacao;
  }
  if (path === '/resultado' && !hasResultado) {
    return hasPending
      ? ANALYSIS_FLOW_MESSAGES.needIdentificacaoForResultado
      : ANALYSIS_FLOW_MESSAGES.needUploadForResultado;
  }
  return null;
}
