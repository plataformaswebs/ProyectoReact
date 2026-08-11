import { supabase } from "../supabase/client";

export const cargarClientesDesdeExcel = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id');

    if (error) throw error;

    return (data || []).map((c) => ({
      idCliente: c.id,
      cliente: c.nombre || "",
      sitioWeb: c.sitio_web || "",
      url: c.url || "",
      telefono: c.telefono?.toString() || "",
      correo: c.correo || "",
      pagado: c.pagado === true,
      valor: c.valor?.toString() || "$0",
      fechaPago: c.fecha_pago || "",
      estado: c.estado === true,
      logoCliente: c.logo_url || "",
      clienteInternacional: c.internacional === true ? 1 : 0,
      suscripcion: c.suscripcion === true,
      tbk_user: c.tbk_user || "",
      tarjeta: c.tarjeta || "",
      tipo_tarjeta: c.tipo_tarjeta || "",
      entorno_tbk: c.entorno_tbk || "",
    }));
  } catch (error) {
    console.error("❌ Error al cargar clientes desde Supabase:", error);
    return [];
  }
};
