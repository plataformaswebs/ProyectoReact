import * as XLSX from "xlsx";

const SEGURIDAD_S3_URL =
  "https://plataformas-web-buckets.s3.us-east-2.amazonaws.com/Seguridad.xlsx";

export const cargarSeguridadDesdeExcel = async () => {
  const isLocal = window.location.hostname === "localhost";
  const urlExcel = isLocal
    ? `/database/Seguridad.xlsx?t=${Date.now()}`
    : `${SEGURIDAD_S3_URL}?t=${Date.now()}`;

  const response = await fetch(urlExcel, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener Seguridad.xlsx");
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(hoja, { defval: "" });
};

export const obtenerConCuposDesdeSeguridad = async () => {
  const rows = await cargarSeguridadDesdeExcel();
  const match = rows.find((row) => String(row.id).trim() === "1");
  const rawValue = match?.valor;

  return (
    rawValue === 1 ||
    rawValue === "1" ||
    String(rawValue).trim().toLowerCase() === "true"
  );
};
