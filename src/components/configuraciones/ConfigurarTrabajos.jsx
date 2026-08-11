import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, Snackbar, Alert, Container, Paper, Slider, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { motion, AnimatePresence } from "framer-motion";
import NavbarAdmin from './NavbarAdmin';
import SidebarAdmin from './SidebarAdmin';
import AddIcon from "@mui/icons-material/Add";
import DialogAgregarTrabajo from "./DialogAgregarTrabajo";
import DialogTrabajoTerminado from "./DialogTrabajoTerminado";
import { CircularProgress } from "@mui/material";
import emailjs from "emailjs-com";
import { supabase } from "../../supabase/client";

const devStatus = (msg) => window.dispatchEvent(new CustomEvent("devtools-status", { detail: { message: msg } }));

const ActionButton = ({ title, color, onClick, icon, compact = false }) => (
  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
    <Tooltip title={title}>
      <IconButton
        size="small"
        color={color}
        onClick={onClick}
        sx={{
          "& svg": { fontSize: compact ? 20 : 28 },
          p: compact ? 0.25 : 0.6,
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  </motion.div>
);
const ConfigurarTrabajos = () => {
  const nombreUsuario = React.useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem("usuario") || "{}");
      const n = u.nombre;
      if (!n || n.includes("@")) return "Administrador";
      return n;
    } catch { return "Administrador"; }
  }, []);
  const [trabajos, setTrabajos] = useState([]);
  const [dbStatus, setDbStatus] = useState("loading");
  const [dbDetail, setDbDetail] = useState("conectando...");
  const [pendingChanges, setPendingChanges] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const cardSize = isMobile ? "300px" : "340px";
  const [openDialogAgregar, setOpenDialogAgregar] = useState(false);
  const [trabajoAEditar, setTrabajoAEditar] = useState(null);
  const [loadingSave, setLoadingSave] = useState(null);
  const [loadingDialog, setLoadingDialog] = useState(false);
  const [loadingSaveAll, setLoadingSaveAll] = useState(false);
  const [loadingDialogAction, setLoadingDialogAction] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [temaOscuro, setTemaOscuro] = useState(() => localStorage.getItem("pw-tema") !== "claro");
  const handleTema = (oscuro) => { setTemaOscuro(oscuro); localStorage.setItem("pw-tema", oscuro ? "oscuro" : "claro"); };
  const [forzarPrd, setForzarPrd] = useState(false);
  const [mostrarTextoAgregarTrabajo, setMostrarTextoAgregarTrabajo] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [dialogFinalizar, setDialogFinalizar] = useState({
    open: false,
    trabajo: null,
  });

  // Función para decidir gradiente según avance
  const getGradient = (val) => {
    if (val < 20) return "linear-gradient(90deg,#ff8a80,#e57373)"; // rojo suave
    if (val < 30) return "linear-gradient(90deg,#ef5350,#e53935)"; // rojo fuerte
    if (val < 70) return "linear-gradient(90deg,#ffb74d,#fb8c00)"; // naranjo
    return "linear-gradient(90deg,#81c784,#388e3c)"; // verde
  };

  const [dialog, setDialog] = useState({
    open: false,
    sitioWeb: "",
    trabajo: null,
  });

  const abrirDialog = (trabajo) => {
    setDialog({
      open: true,
      sitioWeb: trabajo.SitioWeb,
      trabajo,
    });
  };

  const cerrarDialog = () => {
    setDialog({ open: false, sitioWeb: "", trabajo: null });
  };

  const handleEliminar = async () => {
    try {
      setLoadingDialogAction("eliminar"); // 🔒 marca acción

      const url = `${window.location.hostname === "localhost"
        ? "http://localhost:8888"
        : ""
        }/.netlify/functions/eliminarTrabajo`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SitioWeb: dialog.sitioWeb }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al eliminar");

      await fetchTrabajos();
      setSnackbar({ open: true, type: "success", message: "Trabajo eliminado" });
      cerrarDialog();
    } catch (err) {
      console.error("❌ Error al eliminar:", err);
      setSnackbar({ open: true, type: "error", message: "Error al eliminar" });
    } finally {
      setLoadingDialogAction(null); // 🔓 libera
    }
  };

  const handleDeshabilitar = async () => {
    try {
      setLoadingDialogAction("deshabilitar"); // 🔒 marca acción

      const url = `${window.location.hostname === "localhost"
        ? "http://localhost:8888"
        : ""
        }/.netlify/functions/actualizarTrabajo`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SitioWeb: dialog.sitioWeb, nuevoEstado: 0 }), // 👈 corregido
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al deshabilitar");

      await fetchTrabajos();
      setSnackbar({ open: true, type: "success", message: "Trabajo deshabilitado" });
      cerrarDialog();
    } catch (err) {
      console.error("❌ Error al deshabilitar:", err);
      setSnackbar({ open: true, type: "error", message: "Error al deshabilitar" });
    } finally {
      setLoadingDialogAction(null); // 🔓 libera
    }
  };

  const agregarTrabajo = () => {
    setTrabajoAEditar(null);
    setOpenDialogAgregar(true);
  };

  const editarTrabajo = (trabajo) => {
    setTrabajoAEditar(trabajo);
    setOpenDialogAgregar(true);
  };

  useEffect(() => {
    fetchTrabajos();
  }, []);

  useEffect(() => {
    if (trabajos.length > 0)
      console.log("✅ Conectado a Supabase — trabajos:", JSON.stringify(trabajos, null, 2));
  }, [trabajos]);

  const trabajosOrdenados = [...trabajos].sort((a, b) => {
    const aListo = Number(a.Porcentaje) === 100 ? 1 : 0;
    const bListo = Number(b.Porcentaje) === 100 ? 1 : 0;
    return aListo - bListo; // los listos al final
  });

  const trabajosPorPagina = 9;
  const indiceInicio = (paginaActual - 1) * trabajosPorPagina;
  const indiceFin = indiceInicio + trabajosPorPagina;
  const trabajosPaginados = trabajosOrdenados.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(trabajosOrdenados.length / trabajosPorPagina);
  const mostrarPaginacion = totalPaginas > 1;

  const renderPaginacion = () => (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "100%",
        gap: 1,
      }}
    >
      <Button
        variant="outlined"
        disabled={paginaActual === 1}
        onClick={() => setPaginaActual((p) => p - 1)}
        sx={{
          color: temaOscuro ? "white" : "#111",
          borderColor: temaOscuro ? "white" : "#111",
          "&:hover": { borderColor: "#E95420", backgroundColor: "#E95420", color: "#fff" },
        }}
      >
        Anterior
      </Button>
      <Typography variant="body2" sx={{ color: temaOscuro ? "white" : "#111" }}>
        Página {paginaActual} de {totalPaginas}
      </Typography>
      <Button
        variant="outlined"
        disabled={paginaActual === totalPaginas}
        onClick={() => setPaginaActual((p) => p + 1)}
        sx={{
          color: temaOscuro ? "white" : "#111",
          borderColor: temaOscuro ? "white" : "#111",
          "&:hover": { borderColor: "#E95420", backgroundColor: "#E95420", color: "#fff" },
        }}
      >
        Siguiente
      </Button>
    </Box>
  );

  useEffect(() => {
    if (totalPaginas > 0 && paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMostrarTextoAgregarTrabajo(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);



  const handleSaveTrabajo = async (nuevoTrabajo) => {

    await fetchTrabajos();  // 🔄 ahora sí carga versión fresca del Excel

    setSnackbar({ open: true, message: "Trabajo agregado con éxito", type: "success" });
    setOpenDialogAgregar(false);
  };

  const fetchTrabajos = async () => {
    try {
      // 👇 siempre un timestamp nuevo para evitar caché
      const resp = await fetch(
        `https://plataformas-web-buckets.s3.us-east-2.amazonaws.com/Trabajos.xlsx?t=${Date.now()}`
      );
      const buffer = await resp.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(hoja, { defval: "" });
      setTrabajos(data);
      setDbStatus("ok");
      setDbDetail(`${data.length} registros · ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("❌ Error cargando trabajos:", error);
      setDbStatus("error");
      setDbDetail(error.message || "Error desconocido");
    }
  };

  const handleChange = (sitioWeb, field, value) => {
    setPendingChanges((prev) => ({
      ...prev,
      [sitioWeb]: { ...(prev[sitioWeb] || {}), [field]: value },
    }));
  };

  //BOTÓN GUARDAR
  const handleGuardarClick = (trabajo) => {
    if (trabajo.Porcentaje === 100) {
      setDialogFinalizar({ open: true, trabajo });
    } else {
      guardarCambios(trabajo);
    }
  };

  const guardarCambios = async (trabajo) => {
    try {
      setLoadingSaveAll(true);
      devStatus("Guardando trabajo...");

      const { error } = await supabase
        .from("trabajos")
        .update({
          porcentaje: Number(trabajo.Porcentaje),
          estado: Number(trabajo.Estado),
        })
        .eq("sitio_web", trabajo.SitioWeb);

      if (error) throw new Error(error.message);

      setTrabajos((prev) =>
        prev.map((t) =>
          t.SitioWeb === trabajo.SitioWeb
            ? { ...t, Porcentaje: Number(trabajo.Porcentaje), Estado: Number(trabajo.Estado) }
            : t
        )
      );
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[trabajo.SitioWeb];
        return next;
      });
      setSnackbar({ open: true, type: "success", message: "Trabajo actualizado correctamente." });
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      setSnackbar({ open: true, type: "error", message: "Error al guardar cambios" });
    } finally {
      setLoadingSaveAll(false);
      devStatus("");
    }
  };

  //BOTÓN RESTAURAR
  const restaurarTrabajo = async (trabajo) => {
    try {
      setLoadingSaveAll(true); // 🔒 bloquea toda la tabla

      const url = `${window.location.hostname === "localhost"
        ? "http://localhost:8888"
        : ""
        }/.netlify/functions/actualizarTrabajo`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          SitioWeb: trabajo.SitioWeb, // identificador en Excel
          nuevoEstado: 1,             // 👈 corregido
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error al restaurar");
      }

      console.log("✅ Trabajo restaurado:", data);
      await fetchTrabajos(); // refresca tabla
      setSnackbar({ open: true, type: "success", message: "Trabajo restaurado correctamente" });
    } catch (error) {
      console.error("❌ Error al restaurar:", error);
      setSnackbar({ open: true, type: "error", message: "Error al restaurar" });
    } finally {
      setLoadingSaveAll(false); // 🔓 libera la tabla
    }
  };

  // CONFIRMACIÓN + CORREO
  const handleEnviarCorreo = async () => {
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, "0")}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${hoy.getFullYear()}`;

    const params = {
      sitioWeb: dialogFinalizar.trabajo?.SitioWeb || "plataformas-web.cl",
      nombre: dialogFinalizar.trabajo?.NombreCliente || "Ignacio",
      logoCliente:
        dialogFinalizar.trabajo?.LogoCliente ||
        "https://plataformas-web.cl/logo-plataformas-web-correo.png",
      email:
        dialogFinalizar.trabajo?.EmailCliente ||
        "plataformas.web.cl@gmail.com",
      fechaEntrega: fecha,
      cc: "plataformas.web.cl@gmail.com",
    };

    try {
      await emailjs.send(
        "service_tbh6hwi",
        "template_yowj1al",
        params,
        "lwCAuhptLOofypnhx"
      );
      console.log("✅ Correo enviado correctamente a:", params.email, "(CC:", params.cc, ")");
    } catch (error) {
      console.error("❌ Error al enviar correo (template_yowj1al):", error);
      console.error("   status:", error?.status);
      console.error("   text:", error?.text);
      console.error("   params enviados:", params);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", bgcolor: temaOscuro ? "#0a0a0a" : "#f0f0f0" }}>
      {/* Navbar — full width arriba */}
      <NavbarAdmin
        titulo="Configurar Trabajos"
        temaOscuro={temaOscuro}
        onMenuClick={() => setSidebarOpen(prev => !prev)}
        forzarPrd={forzarPrd}
        onForzarPrd={setForzarPrd}
      />
      {/* Sidebar + contenido en fila */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <SidebarAdmin open={sidebarOpen} temaOscuro={temaOscuro} onTemaChange={handleTema} onClose={() => setSidebarOpen(false)} esPrd={forzarPrd} />
        <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto", pb: 4, px: { xs: 1, md: 4 }, pt: 2 }}>

        {/* ── Hero Banner — solo desktop ── */}
        {(() => {
          const iconBoxSx = {
            width: 64, height: 64,
            border: "1px solid rgba(255,255,255,0.35)",
            bgcolor: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          };
          const dashedLines = [
            { top: -40, bottom: -40, left: "-0.5px", borderLeft: "1px dashed rgba(255,255,255,0.55)", maskImage: "linear-gradient(to bottom, transparent, white 30%, white 70%, transparent)" },
            { top: -40, bottom: -40, right: "-0.5px", borderRight: "1px dashed rgba(255,255,255,0.55)", maskImage: "linear-gradient(to bottom, transparent, white 30%, white 70%, transparent)" },
            { left: -40, right: -40, top: "-0.5px", borderTop: "1px dashed rgba(255,255,255,0.7)", maskImage: "linear-gradient(to right, transparent, white 30%, white 70%, transparent)" },
            { left: -40, right: -40, bottom: "-0.5px", borderBottom: "1px dashed rgba(255,255,255,0.7)", maskImage: "linear-gradient(to right, transparent, white 30%, white 70%, transparent)" },
          ];
          const icons = [
            <path key="bolt" d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/>,
            <g key="pkg"><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5"/><path d="M12 12l8 -4.5"/><path d="M12 12l0 9"/><path d="M12 12l-8 -4.5"/><path d="M16 5.25l-8 4.5"/></g>,
            <g key="grid"><path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M14 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/></g>,
            <g key="cpu"><path d="M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M9 9h6v6H9z"/><path d="M3 10h2"/><path d="M3 14h2"/><path d="M10 3v2"/><path d="M14 3v2"/><path d="M21 10h-2"/><path d="M21 14h-2"/><path d="M14 21v-2"/><path d="M10 21v-2"/></g>,
          ];
          return (
            <Box sx={{ display: { xs: "none", md: "block" }, mb: 3 }}>
              <Box sx={{ position: "relative", borderRadius: 3, border: "1px solid rgba(255,255,255,0.15)", overflow: "hidden", px: { md: 5, lg: 6 }, py: { md: 5, lg: 6 } }}>
                {/* Fondo */}
                <Box sx={{ position: "absolute", inset: 0, zIndex: 0, background: import.meta.env.PROD
                  ? "linear-gradient(135deg, #0a0a0a 0%, #160505 30%, rgba(120,10,10,0.55) 58%, rgba(150,10,10,0.85) 78%, #8B0000 100%)"
                  : "linear-gradient(135deg, #0a0a0a 0%, #161616 28%, rgba(17,31,17,1) 52%, rgba(25,60,27,1) 75%, #2e7d32 100%)"
                }} />
                {/* Cuadrícula */}
                <Box sx={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.6, backgroundImage: ["repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.05) 19px, rgba(255,255,255,0.05) 20px, transparent 20px, transparent 39px, rgba(255,255,255,0.05) 39px, rgba(255,255,255,0.05) 40px)", "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.05) 19px, rgba(255,255,255,0.05) 20px, transparent 20px, transparent 39px, rgba(255,255,255,0.05) 39px, rgba(255,255,255,0.05) 40px)", "radial-gradient(circle at 20px 20px, rgba(255,255,255,0.08) 2px, transparent 2px)", "radial-gradient(circle at 40px 40px, rgba(255,255,255,0.08) 2px, transparent 2px)"].join(", "), backgroundSize: "40px 40px, 40px 40px, 40px 40px, 40px 40px" }} />

                {/* Íconos — grupo principal (bolt, package con -translateX, grid) */}
                <Box sx={{ position: "absolute", top: "50%", right: 104, transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}>
                  {[{ icon: icons[0], tx: 0 }, { icon: icons[1], tx: -64 }, { icon: icons[2], tx: 0 }].map(({ icon, tx }, i) => (
                    <Box key={i} sx={{ ...iconBoxSx, transform: tx ? `translateX(${tx}px)` : "none" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                      {dashedLines.map((style, j) => <Box key={j} sx={{ position: "absolute", ...style }} />)}
                    </Box>
                  ))}
                </Box>

                {/* Ícono CPU — translate-x-full, se desvanece a la derecha */}
                <Box sx={{ position: "absolute", top: "50%", right: 104, transform: "translateY(-50%)", zIndex: 1, pointerEvents: "none" }}>
                  <Box sx={{ ...iconBoxSx, transform: "translateX(64px)", maskImage: "linear-gradient(to right, white 75%, transparent 100%)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.8)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">{icons[3]}</svg>
                    {dashedLines.map((style, j) => <Box key={j} sx={{ position: "absolute", ...style }} />)}
                  </Box>
                </Box>

                {/* Contenido */}
                <Box sx={{ position: "relative", zIndex: 2, maxWidth: 520 }}>
                  <Typography sx={{ fontSize: { md: "1.75rem", lg: "2.25rem" }, fontWeight: 500, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.2, fontFamily: "'Poppins', sans-serif" }}>
                    Hola, {nombreUsuario}
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontSize: { md: "0.875rem", lg: "1rem" }, color: "rgba(255,255,255,0.78)", lineHeight: 1.6, maxWidth: 430 }}>
                    Panel de gestión de trabajos en desarrollo. Configura el avance, estados y detalles de cada proyecto activo.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Button onClick={() => setOpenDialogAgregar(true)} sx={{ bgcolor: "#fff", color: "#0a0a0a", fontWeight: 600, fontSize: "0.82rem", borderRadius: 99, px: 2.5, py: 0.9, textTransform: "none", "&:hover": { bgcolor: "rgba(255,255,255,0.88)" } }}>
                      + Agregar trabajo
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })()}




        {/* Cards de trabajos */}
        <Box sx={{ position: "relative" }}>
          {mostrarPaginacion && renderPaginacion()}

          <Box
            sx={{
              display: { xs: "flex", md: "grid" },
              flexDirection: "column",
              gridTemplateColumns: { md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" },
              gap: { xs: 0.5, sm: 0.75, md: 1.5 },
              mt: mostrarPaginacion ? 1 : 0,
              opacity: loadingSaveAll ? 0.5 : 1,
              pointerEvents: loadingSaveAll ? "none" : "auto",
            }}
          >
            {trabajosPaginados.map((trabajo, index) => {
              const pending = pendingChanges[trabajo.SitioWeb] || {};
              const pct = Number(pending.Porcentaje ?? trabajo.Porcentaje);
              const listo = pct === 100;
              const activo = trabajo.Estado === 1;

              return (
                <motion.div
                  key={trabajo.SitioWeb}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: listo
                        ? "1px solid rgba(76,175,80,0.3)"
                        : activo
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(239,83,80,0.2)",
                      bgcolor: temaOscuro ? "#1a1a1a" : "#fff",
                      position: "relative",
                      p: { xs: 1.75, md: 2 },
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: { xs: "stretch", md: "center" },
                      gap: { xs: 1.25, md: 2 },
                      transition: "all 0.2s",
                      "&:hover": {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        "& .accent-bar": { transform: "scaleY(1)" },
                        "& .arrow-icon": { color: "#c62828" },
                      },
                    }}
                  >
                    {/* Accent bar izquierda */}
                    <Box className="accent-bar" sx={{ position: "absolute", inset: "0 auto 0 0", width: 3.5, bgcolor: listo ? "#4caf50" : "#8B0000", transform: "scaleY(0)", transformOrigin: "center", transition: "transform 0.2s", zIndex: 1 }} />

                    {/* Fila superior en mobile: ícono + título + badges */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, zIndex: 2 }}>
                      {/* Caja ícono */}
                      <Box sx={{ width: { xs: 44, md: 48 }, height: { xs: 44, md: 48 }, borderRadius: 2, bgcolor: listo ? "rgba(56,142,60,0.15)" : activo ? "rgba(139,0,0,0.18)" : "rgba(80,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.4rem" }, lineHeight: 1 }}>
                          {Number(trabajo.TipoApp || trabajo.tipoApp) === 1 ? "🌐" : "⚙️"}
                        </Typography>
                      </Box>

                      {/* Título + badges */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: { xs: 0.4, md: 0.75 } }}>
                          <Typography sx={{ fontWeight: 600, fontSize: { xs: "1rem", md: "0.9rem" }, color: temaOscuro ? "#fff" : "#111", fontFamily: "Poppins, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {trabajo.SitioWeb}
                          </Typography>
                          <Box sx={{ px: 0.9, py: 0.1, borderRadius: "999px", backgroundImage: getGradient(pct), flexShrink: 0 }}>
                            <Typography sx={{ fontSize: { xs: "0.7rem", md: "0.6rem" }, fontWeight: 800, color: "#fff", lineHeight: 1.7 }}>{pct}%</Typography>
                          </Box>
                          {!activo && <Typography sx={{ fontSize: { xs: "0.68rem", md: "0.6rem" }, color: "#ef5350", fontWeight: 700, flexShrink: 0 }}>INACTIVO</Typography>}
                          {listo && activo && <Typography sx={{ fontSize: { xs: "0.68rem", md: "0.6rem" }, color: "#66bb6a", fontWeight: 700, flexShrink: 0 }}>✓ LISTO</Typography>}
                        </Box>
                        {/* Slider — solo en desktop dentro de este bloque */}
                        <Box sx={{ display: { xs: "none", md: "block" } }}>
                          <Slider
                            value={pct}
                            onChange={(_, v) => handleChange(trabajo.SitioWeb, "Porcentaje", v)}
                            step={5} min={0} max={100} size="small"
                            sx={{
                              py: "2px",
                              "& .MuiSlider-track": { backgroundImage: getGradient(pct), border: "none", height: 4 },
                              "& .MuiSlider-rail": { height: 4, opacity: temaOscuro ? 0.12 : 0.2, backgroundColor: temaOscuro ? "#fff" : "#000" },
                              "& .MuiSlider-thumb": { width: 12, height: 12, "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 6px rgba(255,255,255,0.1)" } },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Botones + flecha en desktop */}
                      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0, flexShrink: 0, zIndex: 2 }}>
                        <ActionButton compact title="Editar" color="info" onClick={() => editarTrabajo(trabajo)} icon={<EditRoundedIcon />} />
                        <ActionButton compact title={activo ? "Guardar" : "Eliminar"} color={activo ? "primary" : "error"}
                          onClick={() => activo ? handleGuardarClick({ ...trabajo, ...pending }) : abrirDialog(trabajo)}
                          icon={activo ? (loadingSave === trabajo.SitioWeb ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />) : <DeleteIcon />}
                        />
                        <ActionButton compact title={activo ? "Eliminar" : "Restaurar"} color={activo ? "error" : "success"}
                          onClick={() => activo ? abrirDialog(trabajo) : restaurarTrabajo(trabajo)}
                          icon={activo ? <DeleteIcon /> : <RestoreIcon />}
                        />
                      </Box>
                      {Number(trabajo.TipoApp || trabajo.tipoApp) === 1 && (
                        <Box sx={{ display: { xs: "none", md: "flex" } }}
                          className="arrow-icon" component="a" href={`https://${trabajo.SitioWeb}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: temaOscuro ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)", transition: "color 0.2s", textDecoration: "none", alignItems: "center", flexShrink: 0 }}
                        >
                          <ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />
                        </Box>
                      )}
                    </Box>

                    {/* Slider mobile */}
                    <Box sx={{ display: { xs: "block", md: "none" }, px: 0.5, zIndex: 2 }}>
                      <Slider
                        value={pct}
                        onChange={(_, v) => handleChange(trabajo.SitioWeb, "Porcentaje", v)}
                        step={5} min={0} max={100}
                        sx={{
                          py: "4px",
                          "& .MuiSlider-track": { backgroundImage: getGradient(pct), border: "none", height: 6 },
                          "& .MuiSlider-rail": { height: 6, opacity: temaOscuro ? 0.15 : 0.22, backgroundColor: temaOscuro ? "#fff" : "#000" },
                          "& .MuiSlider-thumb": { width: 22, height: 22, "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 8px rgba(255,255,255,0.1)" } },
                        }}
                      />
                    </Box>

                    {/* Botones + flecha en mobile */}
                    <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <ActionButton title="Editar" color="info" onClick={() => editarTrabajo(trabajo)} icon={<EditRoundedIcon />} />
                        <ActionButton title={activo ? "Guardar" : "Eliminar"} color={activo ? "primary" : "error"}
                          onClick={() => activo ? handleGuardarClick({ ...trabajo, ...pending }) : abrirDialog(trabajo)}
                          icon={activo ? (loadingSave === trabajo.SitioWeb ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />) : <DeleteIcon />}
                        />
                        <ActionButton title={activo ? "Eliminar" : "Restaurar"} color={activo ? "error" : "success"}
                          onClick={() => activo ? abrirDialog(trabajo) : restaurarTrabajo(trabajo)}
                          icon={activo ? <DeleteIcon /> : <RestoreIcon />}
                        />
                      </Box>
                      {Number(trabajo.TipoApp || trabajo.tipoApp) === 1 && (
                        <Box component="a" href={`https://${trabajo.SitioWeb}`} target="_blank" rel="noopener noreferrer"
                          sx={{ color: temaOscuro ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", textDecoration: "none", p: 0.5 }}
                        >
                          <ArrowForwardIcon sx={{ fontSize: "1.4rem" }} />
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>

          {loadingSaveAll && (
            <Box
              sx={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%", height: "100%",
                bgcolor: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(2px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
                borderRadius: 2,
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Box>

        {mostrarPaginacion && renderPaginacion()}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.type}>{snackbar.message}</Alert>
        </Snackbar>

        {/*DIALOG: AGREGAR TRABAJO*/}
        <DialogAgregarTrabajo
          open={openDialogAgregar}
          onClose={() => { setOpenDialogAgregar(false); setTrabajoAEditar(null); }}
          onSave={handleSaveTrabajo}
          trabajoEditar={trabajoAEditar}
        />
        {/*DIALOG: ELIMINAR*/}
        <Dialog open={dialog.open} onClose={cerrarDialog} >
          <DialogTitle sx={{ fontWeight: "bold", color: "#e65100", background: "linear-gradient(180deg, #FFF8EC, #FFEFD5)", }}>
            Confirmar acción
          </DialogTitle>
          <DialogContent sx={{ background: "linear-gradient(180deg, #FFF8EC, #FFEFD5)", }}>
            <Typography>
              ¿Desea eliminar el trabajo <b>{dialog.sitioWeb}</b>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ background: "linear-gradient(180deg, #FFF8EC, #FFEFD5)", }}>
            <Button
              onClick={cerrarDialog}
              color="inherit"
              disabled={loadingDialogAction !== null}
            >
              CERRAR
            </Button>
            <Button
              onClick={handleDeshabilitar}
              color="warning"
              variant="outlined"
              disabled={loadingDialogAction !== null}
              startIcon={
                loadingDialogAction === "deshabilitar" ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
            >
              DESHABILITAR
            </Button>
            <Button
              onClick={handleEliminar}
              color="error"
              variant="contained"
              disabled={loadingDialogAction !== null}
              startIcon={
                loadingDialogAction === "eliminar" ? (
                  <CircularProgress size={18} color="inherit" />
                ) : null
              }
            >
              ELIMINAR
            </Button>
          </DialogActions>
        </Dialog>

        <DialogTrabajoTerminado
          open={dialogFinalizar.open}
          trabajo={dialogFinalizar.trabajo}
          onClose={() => setDialogFinalizar({ open: false, trabajo: null })}
          onConfirmar={async () => {
            await guardarCambios(dialogFinalizar.trabajo);
          }}
          onConfirmarConCorreo={async () => {
            await guardarCambios(dialogFinalizar.trabajo);
            await handleEnviarCorreo();
          }}
        />


        </Box>
      </Box>
    </Box>
  );
};

export default ConfigurarTrabajos;


