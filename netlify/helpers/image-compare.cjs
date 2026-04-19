const sharp = require("sharp");

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

async function toNormalizedGrayRaw(imageBuffer, width, height) {
  return sharp(imageBuffer)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();
}

async function compareImages({ imageBuffer, baseImagePath, pixelDelta = 30 }) {
  const baseMeta = await sharp(baseImagePath).metadata();

  if (!baseMeta.width || !baseMeta.height) {
    throw new Error("No se pudo leer la imagen base.");
  }

  const [inputRaw, baseRaw] = await Promise.all([
    toNormalizedGrayRaw(imageBuffer, baseMeta.width, baseMeta.height),
    toNormalizedGrayRaw(baseImagePath, baseMeta.width, baseMeta.height),
  ]);

  let difference = 0;

  for (let i = 0; i < baseRaw.length; i += 1) {
    const delta = Math.abs(inputRaw[i] - baseRaw[i]);
    if (delta >= pixelDelta) {
      difference += 1;
    }
  }

  return difference;
}

module.exports = {
  compareImages,
  decodeBase64Image,
};
