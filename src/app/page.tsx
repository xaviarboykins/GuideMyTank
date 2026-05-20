import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero */}
      <section className="border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Aquarium Utility Platform
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Aquarium compatibility and tank planning tools.
        </h1>

        <p className="mt-4 max-w-3xl text-muted-foreground">
          Search aquarium species, compare tank compatibility, estimate stocking
          levels, and build healthier freshwater tanks.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button>AquaDex</Button>

          <Button variant="outline">Compatibility Checker</Button>

          <Button variant="outline">Stocking Planner</Button>
        </div>
      </section>

      {/* Utility Grid */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">Compatibility Database</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Compare fish species compatibility using temperament, size,
            aggression, water parameters, and tank behavior.
          </p>
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">Tank Stocking Calculator</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Estimate stocking levels and identify overcrowding risks for common
            aquarium sizes.
          </p>
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">AquaDex Species Database</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Browse freshwater fish species including care requirements, diet,
            tank size, temperament, and lifespan.
          </p>
        </div>
      </section>
    </div>
  );
}
