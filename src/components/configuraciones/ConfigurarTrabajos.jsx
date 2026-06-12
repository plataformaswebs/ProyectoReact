import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, Snackbar, Alert, Container, Paper, Slider, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { motion, AnimatePresence } from "framer-motion";
import MenuInferior from './MenuInferior';
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DialogAgregarTrabajo from "./DialogAgregarTrabajo";
import DialogTrabajoTerminado from "./DialogTrabajoTerminado";
import { CircularProgress } from "@mui/material";
import emailjs from "emailjs-com";

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
  const [trabajos, setTrabajos] = useState([]);
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
  const [mostrarMenuInferior, setMostrarMenuInferior] = useState(false);
  const menuInferiorTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);
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
    console.log("Clientes cargados en ConfigurarTrabajos:", trabajos);
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
          color: "white",
          borderColor: "white",
          "&:hover": {
            borderColor: "#E95420",
            backgroundColor: "#E95420",
          },
        }}
      >
        Anterior
      </Button>
      <Typography variant="body2" sx={{ color: "white" }}>
        Página {paginaActual} de {totalPaginas}
      </Typography>
      <Button
        variant="outlined"
        disabled={paginaActual === totalPaginas}
        onClick={() => setPaginaActual((p) => p + 1)}
        sx={{
          color: "white",
          borderColor: "white",
          "&:hover": {
            borderColor: "#E95420",
            backgroundColor: "#E95420",
          },
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

  useEffect(() => {
    return () => {
      if (menuInferiorTimeoutRef.current) clearTimeout(menuInferiorTimeoutRef.current);
    };
  }, []);

  const handleAbrirMenuInferior = () => {
    if (mostrarMenuInferior) {
      setMostrarMenuInferior(false);
      if (menuInferiorTimeoutRef.current) clearTimeout(menuInferiorTimeoutRef.current);
      return;
    }
    setMostrarMenuInferior(true);
    if (menuInferiorTimeoutRef.current) clearTimeout(menuInferiorTimeoutRef.current);
    menuInferiorTimeoutRef.current = setTimeout(() => {
      setMostrarMenuInferior(false);
    }, 4000);
  };

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches?.[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e) => {
    if (touchStartYRef.current == null) return;
    const endY = e.changedTouches?.[0]?.clientY ?? touchStartYRef.current;
    const delta = touchStartYRef.current - endY;
    touchStartYRef.current = null;
    if (delta > 30) {
      handleAbrirMenuInferior();
    }
  };

  const handleSaveTrabajo = async (nuevoTrabajo) => {
    console.log("Nuevo trabajo agregado:", nuevoTrabajo);

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
    } catch (error) {
      console.error("❌ Error cargando trabajos:", error);
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

      const payload = {
        SitioWeb: trabajo.SitioWeb,
        nuevoPorcentaje: Number(trabajo.Porcentaje),
        nuevoEstado: Number(trabajo.Estado),
        fechaCreacion: trabajo.FechaCreacion,
      };

      const url = `${window.location.hostname === "localhost"
        ? "http://localhost:8888"
        : ""
        }/.netlify/functions/actualizarTrabajo`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar");

      // Aplicar cambios al estado guardado (triggers reorder) y limpiar pending
      setTrabajos((prev) =>
        prev.map((t) =>
          t.SitioWeb === trabajo.SitioWeb ? { ...t, ...payload, Porcentaje: payload.nuevoPorcentaje, Estado: payload.nuevoEstado } : t
        )
      );
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[trabajo.SitioWeb];
        return next;
      });
      setSnackbar({
        open: true,
        type: "success",
        message: "Trabajo actualizado correctamente.",
      });
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      setSnackbar({
        open: true,
        type: "error",
        message: "Error al guardar cambios",
      });
    } finally {
      setLoadingSaveAll(false);
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
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        minHeight: "100vh",
        width: "100vw",
        overflowX: "hidden",
        py: 1,
        backgroundImage: "url(fondo-blizz.avif)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <Box sx={{ pt: 10, pb: 4, px: { xs: 1, md: 4 } }}>
        {/* Título */}
        <Box display="flex" alignItems="center" justifyContent="space-between" pb={2}>
          {/* Título */}
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }}>
            <SettingsSuggestIcon
              sx={{
                color: "white",
                fontSize: { xs: 22, sm: 28 },
                mt: "-2px",
                mr: { xs: "-2px", sm: 0 }, // 👈 corrige separación en mobile
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 700,
                fontSize: { xs: "0.9rem", sm: "1.15rem" },
                whiteSpace: "nowrap",
              }}
            >
              Configuración Trabajos
            </Typography>
          </Box>

          {/* Botón agregar trabajo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => agregarTrabajo()}
              variant="outlined"
              color="inherit"
              sx={{
                color: "white",
                borderColor: "white",
                fontSize: { xs: "0.7rem", sm: "0.85rem" },
                px: { xs: 0.9, sm: 1 },
                py: { xs: 0.25, sm: 0.5 },
                minWidth: 36,
                display: "flex",
                alignItems: "center",
                gap: 0,
                overflow: "hidden",
                "&:hover": { backgroundColor: "#ffffff22", borderColor: "#ffffffcc" },
              }}
            >
              <AddIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <AnimatePresence>
                {mostrarTextoAgregarTrabajo && (
                  <motion.span
                    initial={{ maxWidth: 140, opacity: 1, marginLeft: 4 }}
                    exit={{ maxWidth: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap", display: "block" }}
                  >
                    Agregar Trabajo
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </Box>



        {/* Cards de trabajos */}
        <Box sx={{ position: "relative" }}>
          {mostrarPaginacion && renderPaginacion()}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 0.5, sm: 0.75 },
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
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: listo
                        ? "1px solid rgba(76,175,80,0.4)"
                        : activo
                        ? "1px solid rgba(255,255,255,0.12)"
                        : "1px solid rgba(239,83,80,0.3)",
                      background: listo
                        ? "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)"
                        : activo
                        ? "linear-gradient(135deg,#ffffff 0%,#f8fafd 100%)"
                        : "linear-gradient(135deg,#fff8f8 0%,#fef2f2 100%)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
                    }}
                  >
                    {/* Barra de color superior según progreso */}
                    <Box
                      sx={{
                        height: 3,
                        backgroundImage: getGradient(pct),
                        width: `${pct}%`,
                        transition: "width 0.4s ease",
                      }}
                    />

                    <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.2, sm: 0.35 } }}>
                      {/* Fila superior: nombre + badge + acciones */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0 }}>
                        {/* Tipo icono */}
                        <Typography sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, lineHeight: 1, flexShrink: 0 }}>
                          {Number(trabajo.TipoApp || trabajo.tipoApp) === 1 ? "🌐" : "⚙️"}
                        </Typography>

                        {/* Nombre */}
                        <Typography
                          sx={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: { xs: "0.78rem", sm: "0.875rem" },
                            color: Number(trabajo.TipoApp || trabajo.tipoApp) === 1 ? "#0277bd" : "#1b263b",
                            fontFamily: "Poppins, sans-serif",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          component={Number(trabajo.TipoApp || trabajo.tipoApp) === 1 ? "a" : "span"}
                          href={Number(trabajo.TipoApp || trabajo.tipoApp) === 1 ? `https://${trabajo.SitioWeb}` : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none" }}
                        >
                          {trabajo.SitioWeb}
                        </Typography>

                        {/* Badge % */}
                        <Box
                          sx={{
                            px: 0.9,
                            py: 0.1,
                            borderRadius: "999px",
                            backgroundImage: getGradient(pct),
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#fff", lineHeight: 1.6 }}>
                            {pct}%
                          </Typography>
                        </Box>

                        {/* Acciones */}
                        <Box sx={{ display: "flex", gap: 0, flexShrink: 0 }}>
                          <ActionButton compact title="Editar" color="info" onClick={() => editarTrabajo(trabajo)} icon={<EditRoundedIcon />} />
                          <ActionButton
                            compact
                            title={activo ? "Guardar" : "Eliminar"}
                            color={activo ? "primary" : "error"}
                            onClick={() => activo ? handleGuardarClick({ ...trabajo, ...pending }) : abrirDialog(trabajo)}
                            icon={activo
                              ? loadingSave === trabajo.SitioWeb ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                              : <DeleteIcon />}
                          />
                          <ActionButton
                            compact
                            title={activo ? "Eliminar" : "Restaurar"}
                            color={activo ? "error" : "success"}
                            onClick={() => activo ? abrirDialog(trabajo) : restaurarTrabajo(trabajo)}
                            icon={activo ? <DeleteIcon /> : <RestoreIcon />}
                          />
                        </Box>
                      </Box>

                      {/* Slider */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.25 }}>
                        <Box sx={{ flex: 1 }}>
                          <Slider
                            value={pct}
                            onChange={(_, v) => handleChange(trabajo.SitioWeb, "Porcentaje", v)}
                            step={5}
                            min={0}
                            max={100}
                            size="small"
                            sx={{
                              py: "1px",
                              "& .MuiSlider-track": { backgroundImage: getGradient(pct), border: "none", height: 5 },
                              "& .MuiSlider-rail": { height: 5, opacity: 0.2, backgroundColor: "#90a4ae" },
                              "& .MuiSlider-thumb": {
                                width: 13, height: 13,
                                "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 6px rgba(0,0,0,0.08)" },
                              },
                            }}
                          />
                        </Box>
                        {!activo && (
                          <Typography sx={{ fontSize: "0.65rem", color: "#ef5350", fontWeight: 700, flexShrink: 0 }}>
                            INACTIVO
                          </Typography>
                        )}
                        {listo && activo && (
                          <Typography sx={{ fontSize: "0.65rem", color: "#388e3c", fontWeight: 700, flexShrink: 0 }}>
                            ✓ PRD
                          </Typography>
                        )}
                      </Box>
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


        {/* MenuInferior: se abre manualmente y se minimiza solo */}
        <AnimatePresence>
          {mostrarMenuInferior && (
            <MenuInferior cardSize={cardSize} modo="trabajos" enterDuration={1} exitDuration={1} />
          )}
        </AnimatePresence>

        {/* Flecha inferior para abrir menu */}
        <Box
          onClick={handleAbrirMenuInferior}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          sx={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 10,
            zIndex: 1200,
            width: 56,
            height: 30,
            borderRadius: "999px",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: mostrarMenuInferior ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(6px)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            "&:active": { transform: "translateX(-50%) scale(0.98)" },
          }}
        >
          <KeyboardArrowUpIcon
            sx={{
              color: "#fff",
              fontSize: 22,
              transform: mostrarMenuInferior ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </Box>
      </Box>
    </Container >
  );
};

export default ConfigurarTrabajos;


