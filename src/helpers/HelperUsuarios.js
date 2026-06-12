import bcrypt from "bcryptjs";

export const cargarUsuariosDesdeExcel = async () => {
  try {
    const [xlsxMod, response] = await Promise.all([
      import("xlsx"),
      fetch(`/database/Usuarios.xlsx?v=${Date.now()}`),
    ]);
    const XLSX = xlsxMod.default ?? xlsxMod;
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
  } catch (error) {
    console.error("Error al cargar el archivo Excel:", error);
    return [];
  }
};

// 🔐 Validar con comparación de hash
export const validarCredenciales = async (usuarioIngresado, claveIngresada) => {
  const usuarios = await cargarUsuariosDesdeExcel();

  for (const u of usuarios) {
    if (
      u.usuario?.toString().trim().toLowerCase() === usuarioIngresado.trim().toLowerCase()
    ) {
      const esValido = await bcrypt.compare(claveIngresada, u.password?.toString().trim());
      if (esValido) return u; // autenticación exitosa
    }
  }

  return null; // usuario no encontrado o contraseña incorrecta
};
