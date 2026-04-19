const path = require("path");
const { compareImages, decodeBase64Image } = require("../helpers/image-compare.cjs");

const DIFFERENCE_LIMIT = 5000;

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
    const baseImagePath = path.join(__dirname, "reference", "base.jpg");

    const difference = await compareImages({
      imageBuffer,
      baseImagePath,
    });

    const isValid = difference < DIFFERENCE_LIMIT;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: isValid ? "ok" : "error",
        difference,
        message: isValid ? "Imagen válida" : "Se detectaron diferencias",
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
        difference: 0,
        message: error.message || "No se pudo analizar la imagen.",
      }),
    };
  }
};
