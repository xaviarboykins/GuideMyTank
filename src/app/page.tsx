import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const popularSpecies = [
  "Betta Fish",
  "Neon Tetra",
  "Corydoras",
  "Guppy",
  "Angelfish",
  "Cherry Shrimp",
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Main Utility Header */}
      <section className="border border-border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground">
          Freshwater Aquarium Utility Platform
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Aquarium compatibility and tank planning tools.
        </h1>

        <p className="mt-4 max-w-3xl text-muted-foreground">
          Search fish species, compare compatibility, estimate stocking levels,
          and plan healthier freshwater aquariums using practical database-style
          tools.
        </p>

        {/* Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search fish, shrimp, snails, plants..." />

          <Button>Search</Button>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            PisciDex
          </Button>

          <Button variant="outline" size="sm">
            Compatibility Checker
          </Button>

          <Button variant="outline" size="sm">
            Stocking Planner
          </Button>
        </div>
      </section>

      {/* Utility Grid */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">Compatibility Database</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Compare aquarium species using temperament, aggression level, water
            parameters, schooling behavior, and tank size.
          </p>
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">Tank Stocking Calculator</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Estimate safe stocking levels and identify overcrowding risks for
            common freshwater setups.
          </p>
        </div>

        <div className="border border-border bg-card p-4">
          <h2 className="font-semibold">PisciDex Species Database</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Browse fish species data including temperament, tank size, lifespan,
            diet, and care requirements.
          </p>
        </div>
      </section>

      {/* Popular Species */}
      <section className="mt-6 border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Popular Aquarium Species</h2>

          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {popularSpecies.map((species) => (
            <div
              key={species}
              className="border border-border bg-background p-3 text-sm"
            >
              {species}
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Beginner Aquarium Planning</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium">Community Tank Compatibility</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Learn which freshwater fish species can safely coexist based on
              temperament, activity level, schooling requirements, and water
              conditions.
            </p>
          </div>

          <div>
            <h3 className="font-medium">Tank Size and Stocking</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Use practical stocking estimates and planning tools to avoid
              overcrowding and reduce stress within aquarium ecosystems.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
