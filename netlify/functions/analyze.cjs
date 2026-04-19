const path = require("path");
const { analyzeSlots, decodeBase64Image } = require("../helpers/slot-analyzer.cjs");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Método no permitido." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const imageBuffer = decodeBase64Image(body.image);
    const baseImagePath = path.join(__dirname, "reference", "base.jpeg");

    const analysis = await analyzeSlots({
      imageBuffer,
      baseImagePath,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "ok",
        occupiedSlots: analysis.occupiedSlots,
        slots: analysis.slots,
        occupancyPercentage: analysis.occupancyPercentage,
        annotatedImage: analysis.annotatedImage,
        message: analysis.occupiedSlots.length
          ? "Se detectaron ranuras tapadas"
          : "No se detectaron ranuras tapadas",
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "error",
        occupiedSlots: [],
        slots: [],
        occupancyPercentage: 0,
        annotatedImage: null,
        message: error.message || "No se pudo analizar la imagen.",
      }),
    };
  }
};
