import type { PostgrestError } from "@supabase/supabase-js";

import { ContentServiceError } from "./errors";

export function throwContentDatabaseError(error: PostgrestError | null, operation: string): asserts error is null {
  if (!error) return;

  if (error.code === "23505") {
    throw new ContentServiceError("That slug or relationship is already in use.", "conflict");
  }

  if (error.code === "23503") {
    throw new ContentServiceError("A selected related record no longer exists.", "foreign_key");
  }

  if (error.code === "23514" || error.code === "P0001") {
    throw new ContentServiceError(error.message, "validation");
  }

  throw new ContentServiceError(`Failed to ${operation}.`, "database");
}

