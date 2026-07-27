import { composeSchemaGraph } from "../../lib/seo/schema/graph";
import { serializeJsonLd } from "../../lib/seo/schema/serialize";
import type { SchemaEntityInput } from "../../lib/seo/schema/types";

export function JsonLd({
  entities,
  id = "guidemytank-json-ld",
}: {
  entities: SchemaEntityInput;
  id?: string;
}) {
  const result = composeSchemaGraph(entities);

  if (!result.ok || !result.graph) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(result.graph),
      }}
    />
  );
}
