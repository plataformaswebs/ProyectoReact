let sharp;
try { sharp = require("sharp"); } catch (_) {}
const { SLOT_MAP } = require("./slot-config.cjs");

function extractBase64Payload(image) {
  if (typeof image !== "string" || !image.trim()) {
    throw new Error("La imagen no fue enviada.");
  }

  const match = image.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  const rawBase64 = match ? match[1] : image;

  if (!/^[A-Za-z0-9+/=]+$/.test(rawBase64)) {
    throw new Error("La imagen enviada no tiene un formato base64 valido.");
  }

  return rawBase64;
}

function decodeBase64Image(image) {
  const payload = extractBase64Payload(image);
  const buffer = Buffer.from(payload, "base64");

  if (!buffer.length) {
    throw new Error("No se pudo decodificar la imagen.");
  }

  return buffer;
}

function clampRect(rect, width, height) {
  const left = Math.max(0, Math.min(rect.left, width - 1));
  const top = Math.max(0, Math.min(rect.top, height - 1));
  const safeWidth = Math.max(1, Math.min(rect.width, width - left));
  const safeHeight = Math.max(1, Math.min(rect.height, height - top));

  return {
    left,
    top,
    width: safeWidth,
    height: safeHeight,
  };
}

function toAbsoluteSlot(slot, width, height) {
  return {
    ...slot,
    left: Math.round(slot.x * width),
    top: Math.round(slot.y * height),
    width: Math.round(slot.w * width),
    height: Math.round(slot.h * height),
  };
}

function toAbsoluteRect(slot, source, width, height) {
  const slotAbs = toAbsoluteSlot(slot, width, height);
  return clampRect(
    {
      left: slotAbs.left + Math.round(slotAbs.width * source.x),
      top: slotAbs.top + Math.round(slotAbs.height * source.y),
      width: Math.round(slotAbs.width * source.w),
      height: Math.round(slotAbs.height * source.h),
    },
    width,
    height
  );
}

function createEllipseMask(rect, scaleX = 0.88, scaleY = 0.82) {
  const rx = rect.width / 2;
  const ry = rect.height / 2;
  const cx = rx;
  const cy = ry;

  return Buffer.from(
    `<svg width="${rect.width}" height="${rect.height}">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx * scaleX}" ry="${ry * scaleY}" fill="white" />
    </svg>`
  );
}

function isInsideEllipse(x, y, width, height, scaleX = 0.88, scaleY = 0.82) {
  const rx = (width / 2) * scaleX;
  const ry = (height / 2) * scaleY;
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;

  if (rx <= 0 || ry <= 0) {
    return false;
  }

  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

async function getMaskedStats({ imageBuffer, rect, scaleX = 0.88, scaleY = 0.82, brightThreshold = 170, darkThreshold = 32 }) {
  const extracted = await sharp(imageBuffer)
    .extract(rect)
    .composite([{ input: createEllipseMask(rect, scaleX, scaleY), blend: "dest-in" }])
    .raw()
    .toBuffer();

  let sum = 0;
  let count = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  for (let i = 0; i < extracted.length; i += 1) {
    const value = extracted[i];
    if (value > 0) {
      sum += value;
      count += 1;
      if (value < darkThreshold) {
        darkPixels += 1;
      }
      if (value >= brightThreshold) {
        brightPixels += 1;
      }
    }
  }

  const average = count ? sum / count : 0;
  const darkRatio = count ? darkPixels / count : 1;
  const brightRatio = count ? brightPixels / count : 0;

  return {
    average,
    darkRatio,
    brightRatio,
  };
}

async function detectBallMarks({
  imageBuffer,
  rect,
  imageWidth,
  imageHeight,
  scaleX = 0.72,
  scaleY = 0.7,
}) {
  const extracted = await sharp(imageBuffer)
    .extract(rect)
    .raw()
    .toBuffer();

  const visited = new Uint8Array(rect.width * rect.height);
  const marks = [];
  const minArea = Math.max(10, Math.round(rect.width * rect.height * 0.02));

  const indexFor = (x, y) => y * rect.width + x;
  const isActive = (x, y) =>
    extracted[indexFor(x, y)] >= 170 &&
    isInsideEllipse(x, y, rect.width, rect.height, scaleX, scaleY);

  for (let y = 0; y < rect.height; y += 1) {
    for (let x = 0; x < rect.width; x += 1) {
      const startIndex = indexFor(x, y);

      if (visited[startIndex] || !isActive(x, y)) {
        continue;
      }

      const queue = [[x, y]];
      visited[startIndex] = 1;

      let area = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (queue.length) {
        const [currentX, currentY] = queue.pop();
        area += 1;
        minX = Math.min(minX, currentX);
        maxX = Math.max(maxX, currentX);
        minY = Math.min(minY, currentY);
        maxY = Math.max(maxY, currentY);

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) {
              continue;
            }

            const nextX = currentX + offsetX;
            const nextY = currentY + offsetY;

            if (
              nextX < 0 ||
              nextY < 0 ||
              nextX >= rect.width ||
              nextY >= rect.height
            ) {
              continue;
            }

            const nextIndex = indexFor(nextX, nextY);
            if (visited[nextIndex] || !isActive(nextX, nextY)) {
              continue;
            }

            visited[nextIndex] = 1;
            queue.push([nextX, nextY]);
          }
        }
      }

      if (area < minArea) {
        continue;
      }

      const padding = 4;
      const blobWidth = maxX - minX + 1;
      const blobHeight = maxY - minY + 1;
      const createMark = (left, top, width, height) =>
        clampRect(
          {
            left,
            top,
            width,
            height,
          },
          imageWidth,
          imageHeight
        );

      if (blobWidth >= blobHeight * 1.35) {
        const splitWidth = Math.max(10, Math.round(blobWidth * 0.48));
        const gap = Math.max(2, Math.round(blobWidth * 0.04));
        const firstLeft = rect.left + minX - padding;
        const secondLeft = rect.left + minX + blobWidth - splitWidth - padding;
        const top = rect.top + minY - padding;
        const height = blobHeight + padding * 2;

        marks.push(createMark(firstLeft, top, splitWidth + padding * 2 - gap, height));
        marks.push(createMark(secondLeft, top, splitWidth + padding * 2 - gap, height));
        continue;
      }

      marks.push(
        createMark(
          rect.left + minX - padding,
          rect.top + minY - padding,
          blobWidth + padding * 2,
          blobHeight + padding * 2
        )
      );
    }
  }

  return marks;
}

function buildOverlaySvg({ marks, width, height }) {
  const rects = marks
    .map((mark) => {
      return `
        <g>
          <rect
            x="${mark.left}"
            y="${mark.top}"
            width="${mark.width}"
            height="${mark.height}"
            rx="10"
            ry="10"
            fill="rgba(255,82,82,0.02)"
            stroke="#ff3b30"
            stroke-width="4"
          />
        </g>
      `;
    })
    .join("");

  return Buffer.from(
    `<svg width="${width}" height="${height}">
      ${rects}
    </svg>`
  );
}

function isOccupied({ coreStats, shellStats, thresholds }) {
  const coreBlocked = coreStats.brightRatio >= thresholds.coreBrightRatio;
  const shellBlocked = shellStats.brightRatio >= thresholds.coreBrightRatio * 0.7;
  const brightnessBlocked =
    coreStats.average >= thresholds.averageBrightness ||
    shellStats.average >= thresholds.averageBrightness - 12;

  return coreBlocked || (shellBlocked && brightnessBlocked);
}

async function analyzeSlots({ imageBuffer, baseImagePath }) {
  const baseMeta = await sharp(baseImagePath).metadata();

  if (!baseMeta.width || !baseMeta.height) {
    throw new Error("No se pudo leer la imagen base.");
  }

  const normalizedInput = await sharp(imageBuffer)
    .resize(baseMeta.width, baseMeta.height, { fit: "fill" })
    .grayscale()
    .normalise()
    .threshold(145)
    .toBuffer();

  const slots = [];
  const allMarks = [];

  for (const slot of SLOT_MAP) {
    const absoluteSlot = toAbsoluteSlot(slot, baseMeta.width, baseMeta.height);
    const detectRect = toAbsoluteRect(slot, slot.detect, baseMeta.width, baseMeta.height);

    const shellStats = await getMaskedStats({
      imageBuffer: normalizedInput,
      rect: detectRect,
      scaleX: 0.9,
      scaleY: 0.84,
      brightThreshold: 170,
      darkThreshold: 32,
    });

    const coreRect = clampRect(
      {
        left: detectRect.left + Math.round(detectRect.width * 0.14),
        top: detectRect.top + Math.round(detectRect.height * 0.08),
        width: Math.round(detectRect.width * 0.72),
        height: Math.round(detectRect.height * 0.84),
      },
      baseMeta.width,
      baseMeta.height
    );

    const coreStats = await getMaskedStats({
      imageBuffer: normalizedInput,
      rect: coreRect,
      scaleX: 0.72,
      scaleY: 0.7,
      brightThreshold: 170,
      darkThreshold: 32,
    });

    const statsOccupied = isOccupied({
      coreStats,
      shellStats,
      thresholds: {
        coreBrightness: 150,
        coreBrightRatio: 0.14,
        coreDarkRatio: 0.2,
        averageBrightness: 118,
        ...slot.thresholds,
      },
    });

    const markRects = await detectBallMarks({
      imageBuffer: normalizedInput,
      rect: detectRect,
      imageWidth: baseMeta.width,
      imageHeight: baseMeta.height,
      scaleX: 0.9,
      scaleY: 0.84,
    });

    const occupied =
      markRects.length > 0 ||
      statsOccupied ||
      coreStats.brightRatio >= 0.12 ||
      shellStats.brightRatio >= 0.09;

    allMarks.push(...markRects);

    slots.push({
      ...absoluteSlot,
      detectRect,
      markRects,
      coreAverage: Number(coreStats.average.toFixed(2)),
      coreDarkRatio: Number(coreStats.darkRatio.toFixed(3)),
      coreBrightRatio: Number(coreStats.brightRatio.toFixed(3)),
      shellAverage: Number(shellStats.average.toFixed(2)),
      shellDarkRatio: Number(shellStats.darkRatio.toFixed(3)),
      shellBrightRatio: Number(shellStats.brightRatio.toFixed(3)),
      occupied,
    });
  }

  const occupiedSlots = slots.filter((slot) => slot.occupied).map((slot) => slot.id);
  const occupancyPercentage = Number(((occupiedSlots.length / slots.length) * 100).toFixed(1));
  const overlay = buildOverlaySvg({
    marks: allMarks,
    width: baseMeta.width,
    height: baseMeta.height,
  });

  const annotatedBuffer = await sharp(normalizedInput)
    .png()
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return {
    slots,
    occupiedSlots,
    occupancyPercentage,
    annotatedImage: `data:image/jpeg;base64,${annotatedBuffer.toString("base64")}`,
  };
}

module.exports = {
  analyzeSlots,
  decodeBase64Image,
};
