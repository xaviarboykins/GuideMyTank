export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© 2026 GuideMyTank</p>

        <div className="flex items-center gap-4">
          <span>Freshwater Aquarium Tools</span>
          <span>AquaDex</span>
          <span>Compatibility Database</span>
        </div>
      </div>
    </footer>
  );
}
