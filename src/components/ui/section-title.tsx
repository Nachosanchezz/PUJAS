type SectionTitleProps = {
  title: string;
  count?: string;
};

export function SectionTitle({ title, count }: SectionTitleProps) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {count && <span className="text-sm text-foreground/60">{count}</span>}
    </div>
  );
}
