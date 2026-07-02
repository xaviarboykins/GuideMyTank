"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database.types";

import { SpeciesTable } from "@/components/species/species-table";

type Species = Database["public"]["Tables"]["species"]["Row"];

type SpeciesPaginatedTableProps = {
  species: Species[];
  totalSpeciesCount: number;
};

const mobilePageSize = 10;
const desktopPageSize = 15;

function getTotalPages(totalItems: number, pageSize: number) {
  return Math.max(Math.ceil(totalItems / pageSize), 1);
}

function paginate(species: Species[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;

  return species.slice(start, start + pageSize);
}

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3"
      aria-label="Species pagination"
    >
      <Button
        type="button"
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

export function SpeciesPaginatedTable({
  species,
  totalSpeciesCount,
}: SpeciesPaginatedTableProps) {
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPage, setDesktopPage] = useState(1);

  const mobileTotalPages = getTotalPages(species.length, mobilePageSize);
  const desktopTotalPages = getTotalPages(species.length, desktopPageSize);
  const currentMobilePage = Math.min(mobilePage, mobileTotalPages);
  const currentDesktopPage = Math.min(desktopPage, desktopTotalPages);
  const mobileSpecies = paginate(
    species,
    currentMobilePage,
    mobilePageSize,
  );
  const desktopSpecies = paginate(
    species,
    currentDesktopPage,
    desktopPageSize,
  );

  const resultSuffix =
    species.length !== totalSpeciesCount
      ? ` (${totalSpeciesCount} total species)`
      : "";

  return (
    <>
      <p className="text-sm text-muted-foreground md:hidden">
        Showing {mobileSpecies.length} of {species.length} matches
        {resultSuffix}
      </p>
      <p className="hidden text-sm text-muted-foreground md:block">
        Showing {desktopSpecies.length} of {species.length} matches
        {resultSuffix}
      </p>

      <div className="md:hidden">
        <SpeciesTable species={mobileSpecies} />
        <PaginationControls
          currentPage={currentMobilePage}
          totalPages={mobileTotalPages}
          onPageChange={setMobilePage}
        />
      </div>

      <div className="hidden md:block">
        <SpeciesTable species={desktopSpecies} />
        <PaginationControls
          currentPage={currentDesktopPage}
          totalPages={desktopTotalPages}
          onPageChange={setDesktopPage}
        />
      </div>
    </>
  );
}
