"use client";

import {
  acceptedMediaMimeTypes,
  maxMediaFileSize,
  platformMediaTargets,
  type MediaMetadata,
} from "@/schemas/media";
import type { Platform } from "@/schemas/platform";

type BrowserMediaMetadata = Omit<MediaMetadata, "selectedPlatforms" | "warnings">;

export async function getBrowserMediaMetadata(file: File): Promise<BrowserMediaMetadata> {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const dimensions =
    kind === "image" ? await getImageDimensions(file) : await getVideoDimensions(file);

  return {
    fileName: file.name,
    mimeType: file.type,
    byteSize: file.size,
    kind,
    width: dimensions.width,
    height: dimensions.height,
    durationSeconds: dimensions.durationSeconds,
    aspectRatio:
      dimensions.width && dimensions.height ? Number((dimensions.width / dimensions.height).toFixed(6)) : undefined,
  };
}

export function getMediaWarnings(
  media: BrowserMediaMetadata,
  selectedPlatforms: Platform[],
): string[] {
  const warnings: string[] = [];

  if (!acceptedMediaMimeTypes.includes(media.mimeType as (typeof acceptedMediaMimeTypes)[number])) {
    warnings.push(`${media.fileName} uses ${media.mimeType || "an unknown type"}, which is not supported yet.`);
  }

  if (media.byteSize > maxMediaFileSize) {
    warnings.push(`${media.fileName} is over the 100 MB upload limit.`);
  }

  const ratio = media.aspectRatio;

  if (!media.width || !media.height || !ratio) {
    warnings.push(`${media.fileName} metadata could not be fully inspected. It may still need server validation.`);
    return warnings;
  }

  for (const platform of selectedPlatforms) {
    const targets = platformMediaTargets[platform];
    const closeMatch = targets.some((target) => Math.abs(ratio - target.ratio) <= 0.04);

    if (!closeMatch) {
      const targetLabels = targets.map((target) => `${target.label} ${target.width}x${target.height}`).join(", ");
      warnings.push(`${media.fileName} may crop on ${platform}. Best targets: ${targetLabels}.`);
    }
  }

  return warnings;
}

function getImageDimensions(file: File) {
  return new Promise<{ width?: number; height?: number; durationSeconds?: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };

    image.src = url;
  });
}

function getVideoDimensions(file: File) {
  return new Promise<{ width?: number; height?: number; durationSeconds?: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSeconds: Number.isFinite(video.duration) ? video.duration : undefined,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    video.src = url;
  });
}
