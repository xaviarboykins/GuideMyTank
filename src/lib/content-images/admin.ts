import "server-only";

export function createAdminContentImageUrls(storagePaths: string[]) {
  return new Map(
    storagePaths.map((storagePath) => [
      storagePath,
      `/admin/media/content/${storagePath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")}`,
    ]),
  );
}
