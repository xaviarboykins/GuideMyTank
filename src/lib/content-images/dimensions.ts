export async function getContentImageDimensions(file: File) {
  const bitmap = await createImageBitmap(file);

  try {
    if (bitmap.width <= 0 || bitmap.height <= 0) {
      throw new Error("Image dimensions are invalid.");
    }

    return {
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}
