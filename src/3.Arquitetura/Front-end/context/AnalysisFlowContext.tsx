import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO-Front';
import type { AnalysisHistoryItem } from '@Front-end/context/AppContext';

export interface PendingImage {
  preview: string;
  base64: string;
  mimeType: string;
  fileName: string;
}

interface AnalysisFlowContextValue {
  pending: PendingImage | null;
  resultado: DiagnosticoResponseDTO | null;
  location: AnalysisHistoryItem['localizacao'] | null;
  isAnalyzing: boolean;
  setPending: (image: PendingImage) => void;
  setResultado: (result: DiagnosticoResponseDTO | null) => void;
  setLocation: (location: AnalysisHistoryItem['localizacao'] | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  clearFlow: () => void;
}

const AnalysisFlowContext = createContext<AnalysisFlowContextValue | null>(null);

export function AnalysisFlowProvider({ children }: { children: ReactNode }) {
  const [pending, setPendingState] = useState<PendingImage | null>(null);
  const [resultado, setResultadoState] = useState<DiagnosticoResponseDTO | null>(null);
  const [location, setLocationState] = useState<AnalysisHistoryItem['localizacao'] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setPending = useCallback((image: PendingImage) => {
    setPendingState(image);
    setResultadoState(null);
  }, []);

  const setResultado = useCallback((result: DiagnosticoResponseDTO | null) => {
    setResultadoState(result);
  }, []);

  const setLocation = useCallback((loc: AnalysisHistoryItem['localizacao'] | null) => {
    setLocationState(loc);
  }, []);

  const clearFlow = useCallback(() => {
    if (pending?.preview) {
      URL.revokeObjectURL(pending.preview);
    }
    setPendingState(null);
    setResultadoState(null);
    setLocationState(null);
    setIsAnalyzing(false);
  }, [pending?.preview]);

  const value = useMemo(
    () => ({
      pending,
      resultado,
      location,
      isAnalyzing,
      setPending,
      setResultado,
      setLocation,
      setIsAnalyzing,
      clearFlow
    }),
    [pending, resultado, location, isAnalyzing, setPending, setResultado, setLocation, clearFlow]
  );

  return (
    <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>
  );
}

export function useAnalysisFlow() {
  const ctx = useContext(AnalysisFlowContext);
  if (!ctx) throw new Error('useAnalysisFlow must be used within AnalysisFlowProvider');
  return ctx;
}
