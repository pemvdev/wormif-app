// Component: UploadImagem
import { useCallback, useRef } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import { Button } from '@Front-end/components/ui/button';

interface UploadImagemProps {
  preview: string | null;
  error: string | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function UploadImagem({
  preview,
  error,
  isLoading,
  onFileSelect,
  onReset,
  disabled
}: UploadImagemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {!preview ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            relative border-2 border-dashed rounded-2xl p-12
            transition-all duration-300 cursor-pointer
            ${disabled 
              ? 'border-muted bg-muted/30 cursor-not-allowed' 
              : 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10'
            }
          `}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPEG, PNG, WebP ou GIF • Máximo 10MB
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
          <img
            src={preview}
            alt="Preview do espécime"
            className="w-full h-auto max-h-96 object-contain"
          />
          
          {!disabled && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-2 text-white">
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Imagem carregada</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive font-medium text-center">
          {error}
        </p>
      )}
    </div>
  );
}
