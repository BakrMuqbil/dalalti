import sharp from "sharp";

export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_MAX_HEIGHT = 1600;

export const IMAGE_QUALITY = 82;

export interface OptimizedImageResult {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}

/**
 * يحول الصورة إلى WebP ويخفض أبعادها وحجمها
 * مع الحفاظ على نسبة العرض إلى الارتفاع.
 *
 * مهم:
 * - لا يقوم بتكبير الصور الصغيرة.
 * - يقوم بتدوير الصور حسب EXIF.
 * - يزيل metadata غير الضرورية.
 */
export async function optimizeImage(
  input: Buffer,
): Promise<OptimizedImageResult> {
  const originalSize = input.length;

  const image = sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  }).rotate();

  const output = await image
    .resize({
      width: IMAGE_MAX_WIDTH,
      height: IMAGE_MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: IMAGE_QUALITY,
      effort: 4,
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    contentType: "image/webp",
    extension: "webp",
    width: output.info.width,
    height: output.info.height,
    originalSize,
    optimizedSize: output.data.length,
  };
}