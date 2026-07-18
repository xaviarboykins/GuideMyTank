export class ContentServiceError extends Error {
  constructor(
    message: string,
    public readonly code = "content_error",
  ) {
    super(message);
    this.name = "ContentServiceError";
  }
}

export function getSafeContentError(error: unknown) {
  if (error instanceof ContentServiceError) return error;
  return new ContentServiceError("The content operation could not be completed.");
}

