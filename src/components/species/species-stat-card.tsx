type SpeciesStatCardProps = {
  label: string;
  value: string | number | null | undefined;
};

export function SpeciesStatCard({ label, value }: SpeciesStatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value ?? "Unknown"}</p>
    </div>
  );
}
