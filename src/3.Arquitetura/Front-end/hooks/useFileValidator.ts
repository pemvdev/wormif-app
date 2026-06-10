import { useState, useCallback } from 'react';
import { validateFile, fileToBase64, type ValidationResult } from '../utils/FileValidator';

interface UseFileValidatorReturn {
  file: File | null;
  preview: string | null;
  base64: string | null;
  error: string | null;
  isLoading: boolean;
  handleFile: (file: File) => Promise<boolean>;
  reset: () => void;
}

export function useFileValidator(): UseFileValidatorReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (selectedFile: File): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const validation: ValidationResult = validateFile(selectedFile);

    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      setIsLoading(false);
      return false;
    }

    try {
      const base64Data = await fileToBase64(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);

      setFile(selectedFile);
      setBase64(base64Data);
      setPreview(previewUrl);
      setIsLoading(false);
      return true;
    } catch {
      setError('Erro ao processar arquivo');
      setIsLoading(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setBase64(null);
    setError(null);
  }, [preview]);

  return {
    file,
    preview,
    base64,
    error,
    isLoading,
    handleFile,
    reset
  };
}
