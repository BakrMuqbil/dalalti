/**
 * Upload Security — File Upload Hardening for Dalalti
 *
 * يتحقق من:
 * 1. Magic Bytes / File Signature (لا يعتمد على MIME المرسل من العميل)
 * 2. أبعاد الصور (لمنع DoS عبر صور ضخمة)
 * 3. حجم الملف
 * 4. نوع الملف المسموح
 *
 * لا يضيف dependencies خارجية — يستخدم Buffer فقط.
 */

export interface UploadValidationOptions {
  /** الحد الأقصى للحجم بالبايت */
  maxFileSize: number;
  /** الأبعاد القصوى المسموحة [width, height] */
  maxDimensions?: [number, number];
  /** أنواع MIME المسموحة */
  allowedMimeTypes?: string[];
}

export interface UploadValidationResult {
  valid: boolean;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
  error?: string;
}

/* ============================================================
   Magic Bytes / File Signatures
   ============================================================ */

const MAGIC_BYTES: Record<
  string,
  { signatures: number[][]; mime: string; ext: string }
> = {
  jpeg: {
    signatures: [[0xff, 0xd8, 0xff]],
    mime: "image/jpeg",
    ext: "jpg",
  },
  png: {
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    mime: "image/png",
    ext: "png",
  },
  webp: {
    signatures: [
      [0x52, 0x49, 0x46, 0x46], // "RIFF"
    ],
    mime: "image/webp",
    ext: "webp",
  },
  gif: {
    signatures: [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // "GIF87a"
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // "GIF89a"
    ],
    mime: "image/gif",
    ext: "gif",
  },
  avif: {
    signatures: [
      [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66],
      [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66],
    ],
    mime: "image/avif",
    ext: "avif",
  },
};

function checkMagicBytes(buffer: Buffer, signatures: number[][]): boolean {
  for (const sig of signatures) {
    if (buffer.length < sig.length) continue;
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * يحدد نوع الملف الحقيقي من محتواه (Magic Bytes).
 * لا يعتمد على MIME المرسل من العميل.
 */
export function detectRealMimeType(buffer: Buffer): {
  mime: string | null;
  ext: string | null;
} {
  for (const [, info] of Object.entries(MAGIC_BYTES)) {
    if (checkMagicBytes(buffer, info.signatures)) {
      // WebP needs extra check: bytes 8-11 should be "WEBP"
      if (info.mime === "image/webp") {
        if (
          buffer.length >= 12 &&
          buffer[8] === 0x57 && // W
          buffer[9] === 0x45 && // E
          buffer[10] === 0x42 && // B
          buffer[11] === 0x50 // P
        ) {
          return { mime: info.mime, ext: info.ext };
        }
        continue;
      }
      return { mime: info.mime, ext: info.ext };
    }
  }
  return { mime: null, ext: null };
}

/* ============================================================
   Image Dimension Extraction (بدون مكتبات خارجية)
   ============================================================ */

function readUInt16BE(buf: Buffer, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1];
}

function readUInt32BE(buf: Buffer, offset: number): number {
  return (
    (buf[offset] << 24) |
    (buf[offset + 1] << 16) |
    (buf[offset + 2] << 8) |
    buf[offset + 3]
  );
}

function readUInt16LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readUInt24LE(buf: Buffer, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16);
}

function extractPngDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG: IHDR chunk starts at byte 16
  // Width: bytes 16-19 (big-endian)
  // Height: bytes 20-23 (big-endian)
  if (buf.length < 24) return null;
  return {
    width: readUInt32BE(buf, 16),
    height: readUInt32BE(buf, 20),
  };
}

function extractJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  // JPEG: search for SOF markers (0xFFC0, 0xFFC1, 0xFFC2)
  let offset = 2; // skip SOI
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // Skip padding
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    // SOF markers: C0-CF except C4, C8, CC
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        width: readUInt16BE(buf, offset + 5),
        height: readUInt16BE(buf, offset + 3),
      };
    }
    // Other markers: read length and skip
    const len = readUInt16BE(buf, offset + 2);
    offset += 2 + len;
  }
  return null;
}

function extractGifDimensions(buf: Buffer): { width: number; height: number } | null {
  // GIF: Logical Screen Descriptor
  // Width: bytes 6-7 (little-endian)
  // Height: bytes 8-9 (little-endian)
  if (buf.length < 10) return null;
  return {
    width: readUInt16LE(buf, 6),
    height: readUInt16LE(buf, 8),
  };
}

function extractWebpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  // Check VP8 or VP8L chunk at byte 12
  const chunkType = buf.toString("ascii", 12, 16);
  if (chunkType === "VP8 ") {
    // VP8: bytes 26-27 = width (little-endian), bytes 28-29 = height
    // But these are 14-bit values
    const w = readUInt16LE(buf, 26) & 0x3fff;
    const h = readUInt16LE(buf, 28) & 0x3fff;
    return { width: w, height: h };
  }
  if (chunkType === "VP8L") {
    // VP8L: byte 21 has dimensions
    const bits = readUInt24LE(buf, 21);
    const w = (bits & 0x3fff) + 1;
    const h = ((bits >> 14) & 0x3fff) + 1;
    return { width: w, height: h };
  }
  if (chunkType === "VP8X") {
    // VP8X: bytes 24-26 = width-1, bytes 27-29 = height-1
    const w =
      ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xffffff) + 1;
    const h =
      ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xffffff) + 1;
    return { width: w, height: h };
  }
  return null;
}

function extractAvifDimensions(buf: Buffer): { width: number; height: number } | null {
  // AVIF dimension extraction is complex (ISOBMFF format)
  // For security hardening, we skip dimension validation for AVIF
  // and rely on magic bytes + size limits only.
  return null;
}

/**
 * يستخرج أبعاد الصورة من Buffer.
 * يدعم PNG, JPEG, GIF, WebP.
 * AVIF يُعاد null (معقد جداً بدون مكتبة).
 */
export function extractImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  switch (mimeType) {
    case "image/png":
      return extractPngDimensions(buffer);
    case "image/jpeg":
      return extractJpegDimensions(buffer);
    case "image/gif":
      return extractGifDimensions(buffer);
    case "image/webp":
      return extractWebpDimensions(buffer);
    case "image/avif":
      return extractAvifDimensions(buffer);
    default:
      return null;
  }
}

/* ============================================================
   Unified Validation
   ============================================================ */

/**
 * يتحقق من صورة مرفوعة بشكل شامل.
 *
 * @param file — File object من FormData
 * @param options — إعدادات التحقق
 * @returns نتيجة التحقق مع الأبعاد والنوع الحقيقي
 */
export async function validateUploadedImage(
  file: File,
  options: UploadValidationOptions,
): Promise<UploadValidationResult> {
  // 1. حجم الملف
  if (file.size > options.maxFileSize) {
    return {
      valid: false,
      mimeType: null,
      extension: null,
      width: null,
      height: null,
      error: `حجم الملف يتجاوز الحد المسموح (${Math.round(options.maxFileSize / 1024 / 1024)}MB)`,
    };
  }

  // 2. قراءة المحتوى
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 12) {
    return {
      valid: false,
      mimeType: null,
      extension: null,
      width: null,
      height: null,
      error: "ملف الصورة تالف أو غير كامل",
    };
  }

  // 3. Magic Bytes — تحديد النوع الحقيقي
  const detected = detectRealMimeType(buffer);
  if (!detected.mime || !detected.ext) {
    return {
      valid: false,
      mimeType: null,
      extension: null,
      width: null,
      height: null,
      error: "صيغة الملف غير معروفة أو غير مدعومة",
    };
  }

  // 4. التحقق من MIME المسموح
  if (
    options.allowedMimeTypes &&
    !options.allowedMimeTypes.includes(detected.mime)
  ) {
    return {
      valid: false,
      mimeType: detected.mime,
      extension: detected.ext,
      width: null,
      height: null,
      error: `صيغة الملف "${detected.mime}" غير مسموحة`,
    };
  }

  // 5. استخراج الأبعاد
  const dims = extractImageDimensions(buffer, detected.mime);

  // 6. التحقق من الأبعاد القصوى
  if (dims && options.maxDimensions) {
    const [maxW, maxH] = options.maxDimensions;
    if (dims.width > maxW || dims.height > maxH) {
      return {
        valid: false,
        mimeType: detected.mime,
        extension: detected.ext,
        width: dims.width,
        height: dims.height,
        error: `أبعاد الصورة (${dims.width}x${dims.height}) تتجاوز الحد المسموح (${maxW}x${maxH})`,
      };
    }
  }

  return {
    valid: true,
    mimeType: detected.mime,
    extension: detected.ext,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
  };
}
