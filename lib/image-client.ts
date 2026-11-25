export const MAX_IMAGE_DATA_URL_LENGTH = 850_000

export async function compressPhoto(file: File, maxDimension: number): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.")
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) throw new Error("This browser cannot process the image.")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const image = canvas.toDataURL("image/jpeg", 0.72)
    if (image.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error("The image is too large. Choose a smaller photo.")
    }
    return image
  } finally {
    bitmap.close()
  }
}
