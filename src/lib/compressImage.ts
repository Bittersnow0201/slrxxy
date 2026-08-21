/** Compress image in browser before cloud upload. */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('无法压缩图片')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/jpeg', quality)
  })

  if (!blob) throw new Error('图片压缩失败')
  return blob
}
