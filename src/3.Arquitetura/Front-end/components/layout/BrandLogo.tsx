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
      <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-full object-cover" />
      {!compact && (
        <span className="font-bold text-lg text-foreground tracking-tight">Wormif</span>
      )}
    </Link>
  );
}
