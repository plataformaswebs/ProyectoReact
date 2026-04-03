const AWS = require("aws-sdk");
const XLSX = require("xlsx");
require("dotenv").config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.MY_AWS_REGION || "us-east-1";
const FILE_KEY = "Seguridad.xlsx";

AWS.config.update({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: REGION,
});

const s3 = new AWS.S3();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Metodo no permitido" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { id = 1, valor } = body;

    if (typeof valor === "undefined") {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Falta el valor" }),
      };
    }

    const s3Data = await s3.getObject({ Bucket: BUCKET_NAME, Key: FILE_KEY }).promise();
    const workbook = XLSX.read(s3Data.Body, { type: "buffer" });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(hoja, { defval: "" });

    let actualizado = false;

    const nuevosDatos = datos.map((rowOriginal) => {
      const rowId = String(rowOriginal.id ?? "").trim();

      if (rowId === String(id).trim()) {
        actualizado = true;
        return {
          ...rowOriginal,
          valor: Number(valor) ? 1 : 0,
        };
      }

      return rowOriginal;
    });

    if (!actualizado) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Registro no encontrado" }),
      };
    }

    const nuevaHoja = XLSX.utils.json_to_sheet(nuevosDatos);
    workbook.Sheets[workbook.SheetNames[0]] = nuevaHoja;
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "OK", id, valor: Number(valor) ? 1 : 0 }),
    };
  } catch (error) {
    console.error("Error al actualizar Seguridad.xlsx:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Error interno" }),
    };
  }
};
