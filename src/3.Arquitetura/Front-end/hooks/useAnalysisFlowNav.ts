import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { useApp } from '@Front-end/context/AppContext';
import {
  getAnalysisFlowBlockReason,
  type AnalysisFlowPath
} from '@Front-end/utils/analysisFlowNav';

export function useAnalysisFlowNav() {
  const navigate = useNavigate();
  const { pending, resultado, isAnalyzing } = useAnalysisFlow();
  const { showToast } = useApp();

  const navigateToAnalysisStep = useCallback(
    (path: AnalysisFlowPath, onAfterNavigate?: () => void) => {
      if (isAnalyzing) {
        showToast('info', 'Aguarde a identificação por IA terminar.');
        return false;
      }
      const block = getAnalysisFlowBlockReason(path, Boolean(pending), Boolean(resultado));
      if (block) {
        showToast('info', block);
        navigate('/upload');
        return false;
      }
      navigate(path);
      onAfterNavigate?.();
      return true;
    },
    [pending, resultado, isAnalyzing, showToast, navigate]
  );

  return { navigateToAnalysisStep };
}
