import { Info } from 'lucide-react';

interface AuthNoticeProps {
  message: string;
}

export function AuthNotice({ message }: AuthNoticeProps) {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
    >
      <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" aria-hidden />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
