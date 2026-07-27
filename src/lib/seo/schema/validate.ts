import type {
  SchemaEntity,
  SchemaGraph,
  SchemaReference,
} from "./types";
import { isAbsoluteHttpUrl, isValidId } from "./validation";

export type SchemaValidationIssue = {
  code: string;
  path: string;
  message: string;
};

function isReference(value: unknown): value is SchemaReference {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as SchemaReference)["@id"] === "string"
  );
}

function collectReferences(value: unknown, output: string[]) {
  if (isReference(value)) {
    output.push(value["@id"]);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectReferences(item, output);
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const child of Object.values(value)) {
      collectReferences(child, output);
    }
  }
}

function validatePositions(
  positions: readonly number[],
  path: string,
  issues: SchemaValidationIssue[],
) {
  positions.forEach((position, index) => {
    if (position !== index + 1) {
      issues.push({
        code: "invalid_position",
        path: `${path}[${index}].position`,
        message: `Expected position ${index + 1}, received ${position}.`,
      });
    }
  });
}

function validateEntity(
  entity: SchemaEntity,
  index: number,
  issues: SchemaValidationIssue[],
) {
  const path = `@graph[${index}]`;

  if (!isValidId(entity["@id"])) {
    issues.push({
      code: "invalid_id",
      path: `${path}.@id`,
      message: "Entity IDs must be absolute HTTP(S) URLs with a fragment.",
    });
  }

  if ("url" in entity && !isAbsoluteHttpUrl(entity.url)) {
    issues.push({
      code: "invalid_url",
      path: `${path}.url`,
      message: "Entity URLs must be absolute HTTP(S) URLs.",
    });
  }

  if (entity["@type"] === "BreadcrumbList") {
    validatePositions(
      entity.itemListElement.map((item) => item.position),
      `${path}.itemListElement`,
      issues,
    );
    entity.itemListElement.forEach((item, itemIndex) => {
      if (!isAbsoluteHttpUrl(item.item)) {
        issues.push({
          code: "invalid_url",
          path: `${path}.itemListElement[${itemIndex}].item`,
          message: "Breadcrumb item URLs must be absolute HTTP(S) URLs.",
        });
      }
    });
  }

  if (entity["@type"] === "ItemList") {
    validatePositions(
      entity.itemListElement.map((item) => item.position),
      `${path}.itemListElement`,
      issues,
    );
    if (entity.numberOfItems !== entity.itemListElement.length) {
      issues.push({
        code: "item_count_mismatch",
        path: `${path}.numberOfItems`,
        message: "numberOfItems must match itemListElement length.",
      });
    }
    entity.itemListElement.forEach((item, itemIndex) => {
      if (!isAbsoluteHttpUrl(item.url)) {
        issues.push({
          code: "invalid_url",
          path: `${path}.itemListElement[${itemIndex}].url`,
          message: "ItemList URLs must be absolute HTTP(S) URLs.",
        });
      }
    });
  }

  if (entity["@type"] === "FAQPage") {
    const questions = new Set<string>();
    entity.mainEntity.forEach((question, questionIndex) => {
      const normalized = question.name.trim().toLocaleLowerCase("en-US");
      if (!normalized || !question.acceptedAnswer.text.trim()) {
        issues.push({
          code: "incomplete_faq",
          path: `${path}.mainEntity[${questionIndex}]`,
          message: "FAQ questions and answers must be nonblank.",
        });
      } else if (questions.has(normalized)) {
        issues.push({
          code: "duplicate_faq",
          path: `${path}.mainEntity[${questionIndex}].name`,
          message: "FAQ questions must be unique.",
        });
      }
      questions.add(normalized);
    });
  }
}

export function validateSchemaGraph(
  graph: SchemaGraph | null,
  options: { indexable?: boolean } = {},
) {
  const issues: SchemaValidationIssue[] = [];
  if (!graph) return issues;

  if (graph["@context"] !== "https://schema.org") {
    issues.push({
      code: "invalid_context",
      path: "@context",
      message: "Schema graphs must use https://schema.org.",
    });
  }

  const ids = new Set<string>();
  graph["@graph"].forEach((entity, index) => {
    if (ids.has(entity["@id"])) {
      issues.push({
        code: "duplicate_id",
        path: `@graph[${index}].@id`,
        message: `Duplicate entity ID: ${entity["@id"]}`,
      });
    }
    ids.add(entity["@id"]);
    validateEntity(entity, index, issues);
  });

  const references: string[] = [];
  graph["@graph"].forEach((entity) => collectReferences(entity, references));
  references.forEach((id) => {
    if (!ids.has(id)) {
      issues.push({
        code: "missing_reference",
        path: "@graph",
        message: `Referenced entity is absent from the graph: ${id}`,
      });
    }
  });

  if (options.indexable === false) {
    graph["@graph"].forEach((entity, index) => {
      if (entity["@type"] === "Article" || entity["@type"] === "FAQPage") {
        issues.push({
          code: "nonindexable_public_schema",
          path: `@graph[${index}]`,
          message: `${entity["@type"]} must not be emitted for unpublished content.`,
        });
      }
    });
  }

  return issues;
}
