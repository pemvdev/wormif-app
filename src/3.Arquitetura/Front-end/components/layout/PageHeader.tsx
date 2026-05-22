interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-xl leading-relaxed">{description}</p>
      )}
    </header>
  );
}
