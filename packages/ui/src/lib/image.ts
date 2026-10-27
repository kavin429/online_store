/**
 * Image helpers shared by the offer forms (browser) and the offer API routes.
 *
 * Offers store their banner/gallery as base64 data URLs in the database, so an
 * uncompressed camera photo turns into a multi-megabyte SQL statement. Large
 * statements can make MySQL/MariaDB drop the connection (Prisma P1017) or fail
 * with "Parameter ... is longer than max_long_data_size". Everything is
 * therefore resized/compressed in the browser before it is sent to the API,
 * and the API re-checks the limits before touching the database.
 */

/** Target size of a single compressed image (base64 string length). */
export const OFFER_IMAGE_TARGET_BYTES = 400 * 1024;

/** Hard limit for one image accepted by the API. */
export const OFFER_IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;

/** Hard limit for all images of one offer combined. */
export const OFFER_IMAGES_TOTAL_MAX_BYTES = 6 * 1024 * 1024;

/** Hard limit for the whole JSON request body. */
export const OFFER_REQUEST_MAX_BYTES = 8 * 1024 * 1024;

/** Largest source file the browser will try to resize. */
export const OFFER_IMAGE_SOURCE_MAX_BYTES = 12 * 1024 * 1024;

export const OFFER_IMAGE_MAX_DIMENSION = 1600;

export type OfferImageValidation =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validates the `image` / `images` fields of an offer payload. Used by the
 * admin and vendor API routes so oversized payloads are rejected with a clear
 * message instead of being handed to the database.
 */
export function validateOfferImages(image: unknown, images: unknown): OfferImageValidation {
  const sources: string[] = [];

  if (typeof image === "string" && image.length > 0) sources.push(image);
  if (Array.isArray(images)) {
    for (const value of images) {
      if (typeof value === "string" && value.length > 0) sources.push(value);
    }
  }

  let total = 0;
  for (const src of sources) {
    if (src.length > OFFER_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: "One of the offer images is too large. Please remove it and upload it again.",
      };
    }
    total += src.length;
  }

  if (total > OFFER_IMAGES_TOTAL_MAX_BYTES) {
    return {
      ok: false,
      error: "The offer images are too large together. Please use fewer or smaller images.",
    };
  }

  return { ok: true };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the selected image."));
    img.src = src;
  });
}

export type CompressImageOptions = {
  /** Maximum base64 string length of the result. */
  maxBytes?: number;
  /** Longest edge in pixels. */
  maxDimension?: number;
};

/**
 * Resizes and re-encodes an image in the browser, returning a JPEG data URL
 * that fits the size limits. Small images are returned unchanged so PNG
 * transparency and animation are preserved where possible.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<string> {
  const maxBytes = options.maxBytes ?? OFFER_IMAGE_TARGET_BYTES;
  const maxDimension = options.maxDimension ?? OFFER_IMAGE_MAX_DIMENSION;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > OFFER_IMAGE_SOURCE_MAX_BYTES) {
    throw new Error("This image is too large. Please choose a file under 12 MB.");
  }

  const original = await readAsDataUrl(file);

  // Re-encoding would destroy GIF animation / SVG vector data.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    if (original.length > OFFER_IMAGE_MAX_BYTES) {
      throw new Error("This image is too large. Please choose a smaller file.");
    }
    return original;
  }

  const img = await loadImage(original);
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Could not read the image dimensions.");
  }

  if (original.length <= maxBytes && Math.max(sourceWidth, sourceHeight) <= maxDimension) {
    return original;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process the selected image.");

  let scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));

  // Shrink until the encoded result fits. Five passes is enough even for very
  // detailed photos.
  for (let pass = 0; pass < 5; pass++) {
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    canvas.width = width;
    canvas.height = height;

    // JPEG has no alpha channel; paint a white background first.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(img, 0, 0, width, height);

    for (let quality = 0.85; quality >= 0.45; quality -= 0.1) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= maxBytes) return dataUrl;
    }

    scale *= 0.75;
  }

  throw new Error("Could not compress this image enough. Please choose a smaller image.");
}
