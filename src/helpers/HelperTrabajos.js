import * as XLSX from "xlsx";

export const cargarTrabajos = async (urlExcel) => {
  try {
    const response = await fetch(urlExcel, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    });
    if (!response.ok) throw new Error("No se pudo obtener el archivo Excel");

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });

    // 👇 siempre tomamos la primera hoja
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(hoja);

    // 👇 mapeamos al formato esperado de trabajos
    const trabajos = jsonData.map((row) => ({
      SitioWeb: row["SitioWeb"] || "",
      NombreCliente: row["NombreCliente"] || "",
      EmailCliente: row["EmailCliente"] || "",
      LogoCliente: row["LogoCliente"] || "",
      TelefonoCliente: row["TelefonoCliente"] || "",
      Porcentaje: Number(row["Porcentaje"]) || 0,
      Estado: row["Estado"] === 1, // convierte 0/1 a booleano
      TipoApp: Number(row["TipoApp"]) || 0,
      FechaCreacion: row["FechaCreacion"] || ""
    }));

    return trabajos;
  } catch (error) {
    console.error("❌ Error al cargar trabajos desde el Excel:", error);
    return [];
  }
};
