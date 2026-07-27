import type {
  SchemaEntity,
  SchemaEntityInput,
  SchemaGraph,
} from "./types";

export type SchemaConflict = {
  id: string;
  existing: SchemaEntity;
  incoming: SchemaEntity;
};

export type SchemaGraphResult =
  | { ok: true; graph: SchemaGraph | null }
  | { ok: false; conflicts: SchemaConflict[] };

function flattenEntities(
  input: SchemaEntityInput,
  output: SchemaEntity[],
) {
  if (!input) return;

  if (Array.isArray(input)) {
    for (const item of input) flattenEntities(item, output);
    return;
  }

  output.push(input as SchemaEntity);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }

  return value;
}

function entitiesMatch(left: SchemaEntity, right: SchemaEntity) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export function composeSchemaGraph(
  ...inputs: readonly SchemaEntityInput[]
): SchemaGraphResult {
  const flattened: SchemaEntity[] = [];
  for (const input of inputs) flattenEntities(input, flattened);

  const entities: SchemaEntity[] = [];
  const entitiesById = new Map<string, SchemaEntity>();
  const conflicts: SchemaConflict[] = [];

  for (const entity of flattened) {
    const existing = entitiesById.get(entity["@id"]);

    if (!existing) {
      entitiesById.set(entity["@id"], entity);
      entities.push(entity);
      continue;
    }

    if (!entitiesMatch(existing, entity)) {
      conflicts.push({ id: entity["@id"], existing, incoming: entity });
    }
  }

  if (conflicts.length) return { ok: false, conflicts };
  if (entities.length === 0) return { ok: true, graph: null };

  return {
    ok: true,
    graph: {
      "@context": "https://schema.org",
      "@graph": entities,
    },
  };
}
