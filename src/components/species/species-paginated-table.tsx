"use client";

import { useEffect, useState } from "react";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(desktopPageSize);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function updatePageSize() {
      setPageSize(mediaQuery.matches ? mobilePageSize : desktopPageSize);
      setPage(1);
    }

    updatePageSize();
    mediaQuery.addEventListener("change", updatePageSize);

    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, []);

  const totalPages = getTotalPages(species.length, pageSize);
  const currentPage = Math.min(page, totalPages);
  const visibleSpecies = paginate(species, currentPage, pageSize);

  const resultSuffix =
    species.length !== totalSpeciesCount
      ? ` (${totalSpeciesCount} total species)`
      : "";

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Showing {visibleSpecies.length} of {species.length} matches
        {resultSuffix}
      </p>

      <SpeciesTable species={visibleSpecies} />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
