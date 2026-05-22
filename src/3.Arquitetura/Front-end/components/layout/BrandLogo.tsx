import { Bug } from 'lucide-react';
import { Link } from 'react-router';

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact }: BrandLogoProps) {
  return (
    <Link
      to="/upload"
      className="inline-flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Wormif — ir para upload"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
        <Bug className="h-5 w-5 text-primary-foreground" aria-hidden />
      </span>
      {!compact && (
        <span className="font-bold text-lg text-foreground tracking-tight">Wormif</span>
      )}
    </Link>
  );
}
