import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, TextField, Snackbar, Alert, Container, Paper, LinearProgress, Tooltip, useTheme, useMediaQuery } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { motion, AnimatePresence } from "framer-motion";
import MenuInferior from './MenuInferior';
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DialogAgregarTrabajo from "./DialogAgregarTrabajo";
import DialogTrabajoTerminado from "./DialogTrabajoTerminado";
import { CircularProgress } from "@mui/material";
import emailjs from "emailjs-com";

const ActionButton = ({ title, color, onClick, icon }) => (
  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
    <Tooltip title={title}>
      <IconButton
        size="small"
        color={color}
        onClick={onClick}
        sx={{
          "& svg": { fontSize: 28 },    // más grandes
          p: 0.6,                       // menos padding interno
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  </motion.div>
);
const ConfigurarTrabajos = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const cardSize = isMobile ? "300px" : "340px";
  const [openDialogAgregar, setOpenDialogAgregar] = useState(false);
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
        PÃ¡gina {paginaActual} de {totalPaginas}
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
    setTrabajos((prevTrabajos) =>
      prevTrabajos.map((trabajo) =>
        trabajo.SitioWeb === sitioWeb
          ? { ...trabajo, [field]: value }
          : trabajo
      )
    );
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
              startIcon={<AddIcon sx={{ mr: mostrarTextoAgregarTrabajo ? -0.5 : 0 }} />}
              sx={{
                color: "white",
                borderColor: "white",
                fontSize: { xs: "0.7rem", sm: "0.85rem" }, // 👈 más chico
                px: { xs: mostrarTextoAgregarTrabajo ? 1 : 0.9, sm: mostrarTextoAgregarTrabajo ? 1.5 : 1 }, // padding horizontal reducido
                py: { xs: 0.25, sm: 0.5 }, // padding vertical reducido
                minWidth: mostrarTextoAgregarTrabajo ? "auto" : 36,
                transition: "all 0.2s ease",
                "& .MuiButton-startIcon": {
                  marginRight: mostrarTextoAgregarTrabajo ? "2px" : 0,
                  marginLeft: mostrarTextoAgregarTrabajo ? "-2px" : 0,
                },
                "&:hover": {
                  backgroundColor: "#ffffff22",
                  borderColor: "#ffffffcc",
                },
              }}
            >
              {mostrarTextoAgregarTrabajo ? "Agregar Trabajo" : ""}
            </Button>
          </motion.div>
        </Box>



        {/* Tabla */}
        <Box sx={{ position: "relative" }}>
          <Paper
            sx={{
              overflow: "hidden",
              borderRadius: 3,
              boxShadow: 6,
              opacity: loadingSaveAll ? 0.5 : 1,
              pointerEvents: loadingSaveAll ? "none" : "auto",
            }}
          >
            {mostrarPaginacion && renderPaginacion()}
            <Table
              stickyHeader
              size="small"
              sx={{
                minWidth: isMobile ? 400 : "auto",
                "& .MuiTableCell-root": {
                  fontFamily: "Poppins, sans-serif",
                  border: "none !important", // 🚫 fuerza quitar todos los bordes
                },
                "& .MuiTableCell-head": {
                  backgroundColor: "#ffffff",
                  fontWeight: "bold",
                  color: "#1b263b",
                  fontFamily: "Poppins, sans-serif",
                  border: "none !important",        // 🚫 sin líneas horizontales ni verticales
                  "&:before, &:after": {            // 🚫 quita pseudo-elementos que pintan líneas
                    display: "none !important",
                  },
                },
                "& .MuiTableCell-body": {
                  borderTop: "1px solid rgba(0,0,0,0.1)",    // ✅ solo arriba
                  borderBottom: "1px solid rgba(0,0,0,0.1)", // ✅ solo abajo
                },
              }}
            >


              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: "70%",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      border: "none",   // 🚫 sin bordes
                    }}
                  >
                    Sitios Web/Sistemas
                  </TableCell>

                  <TableCell
                    sx={{
                      width: "20%",
                      pr: 0,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      border: "none",   // 🚫 sin bordes
                    }}
                  >
                    Progreso
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width: "10%",
                      pl: 0,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      py: { xs: 0.5, sm: 1 },
                      border: "none",   // 🚫 sin bordes
                    }}
                  />
                </TableRow>
              </TableHead>



              <TableBody>
                {trabajosPaginados.map((trabajo, index) => (
                  <TableRow
                    key={trabajo.SitioWeb}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    sx={{
                      bgcolor: trabajo.Porcentaje === 100 ? "#e8f5e9" : "#ffffff",
                      "&:nth-of-type(odd)": {
                        bgcolor: trabajo.Porcentaje === 100 ? "#e8f5e9" : "#f9f9f9",
                      },
                      "&:hover": {
                        bgcolor:
                          trabajo.Porcentaje === 100 ? "#c8e6c9" : "#f1f7ff",
                      },
                      "& td, & th": {
                        py: { xs: 0.2, sm: 0.35 },
                        px: { xs: 1, sm: 2 },
                        fontSize: { xs: "0.75rem", sm: "0.85rem" },
                        color: "#1b263b",
                        fontFamily: "Poppins, sans-serif",
                        borderTop: "1px solid rgba(0,0,0,0.1)",     // ✅ solo arriba
                        borderBottom: "1px solid rgba(0,0,0,0.1)",  // ✅ solo abajo
                        borderLeft: "none",                        // 🚫 quitamos lados
                        borderRight: "none",
                      },
                    }}
                  >

                    {/* Sitio Web */}
                    <TableCell
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        whiteSpace: "nowrap",
                        color: trabajo.tipoApp === 1 ? "#0288d1" : "#333",
                        fontWeight: 600,
                        cursor: trabajo.tipoApp === 1 ? "pointer" : "default",
                        textDecoration: "none",
                      }}
                    >
                      {trabajo.tipoApp === 1 ? (
                        <a
                          href={`https://${trabajo.SitioWeb}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "#0288d1" }}
                        >
                          {trabajo.SitioWeb}
                        </a>
                      ) : (
                        trabajo.SitioWeb
                      )}
                    </TableCell>



                    {/* Progreso editable */}
                    <TableCell sx={{ pr: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row", // 📱 columna / 🖥️ fila
                          alignItems: "center",
                          gap: isMobile ? 0.5 : 1, // 👈 más pegado en mobile
                          width: "100%",
                        }}
                      >
                        {/* Barra de progreso */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            flex: 1,
                            width: isMobile ? "100%" : "100%", // 📱 compacto / 🖥️ full
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={trabajo.Porcentaje}
                            sx={{
                              flex: 1,
                              height: 8,
                              borderRadius: 2,
                              "& .MuiLinearProgress-bar": {
                                backgroundImage: getGradient(trabajo.Porcentaje), // 🎨 gradiente dinámico
                                transition: "transform 0.6s ease-in-out",
                              },
                            }}
                          />

                          <Typography
                            variant="body2"
                            sx={{
                              minWidth: 32,
                              textAlign: "right",
                              fontWeight: 600,
                            }}
                          >
                            {trabajo.Porcentaje}%
                          </Typography>
                        </Box>

                        {/* Input de porcentaje */}
                        <TextField
                          type="number"
                          value={trabajo.Porcentaje}
                          onChange={(e) => {
                            let val = e.target.value;

                            // evitar 0 iniciales innecesarios
                            if (/^0\d+/.test(val)) {
                              val = val.replace(/^0+/, "");
                            }

                            // limitar entre 0 y 100
                            let num = Math.min(100, Math.max(0, Number(val || 0)));

                            // actualiza el estado con el número ya corregido
                            handleChange(trabajo.SitioWeb, "Porcentaje", num);
                          }}
                          inputProps={{
                            min: 0,
                            max: 100,
                            style: { textAlign: "right" },
                          }}
                          size="small"
                          sx={{
                            width: 90,
                            alignSelf: isMobile ? "flex-start" : "center",
                            mt: isMobile ? 0.25 : 0,
                          }}
                        />



                      </Box>
                    </TableCell>


                                        {/* Botones de acción */}
                    <TableCell align="center">
                      <Box sx={{ display: "inline-flex", gap: 0.3 }}>
                        <ActionButton
                          title={trabajo.Estado === 1 ? "Guardar cambios" : "Eliminar"}
                          color={trabajo.Estado === 1 ? "primary" : "error"}
                          disabled={trabajo.Estado === 1 ? loadingSave === trabajo.SitioWeb : loadingDialogAction === "eliminar"}
                          onClick={() => {
                            if (trabajo.Estado === 1) {
                              handleGuardarClick(trabajo);   // 👈 usamos el nuevo handler
                            } else {
                              abrirDialog(trabajo); // eliminar con confirmación
                            }
                          }}
                          icon={
                            trabajo.Estado === 1 ? (
                              loadingSave === trabajo.SitioWeb ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <SaveIcon />
                              )
                            ) : (
                              <DeleteIcon />
                            )
                          }
                        />
                        <ActionButton
                          title={trabajo.Estado === 1 ? "Eliminar" : "Restaurar"}
                          color={trabajo.Estado === 1 ? "error" : "success"}
                          onClick={() => {
                            if (trabajo.Estado === 1) {
                              abrirDialog(trabajo); // eliminar con confirmación
                            } else {
                              restaurarTrabajo(trabajo); // restaurar directo
                            }
                          }}
                          icon={trabajo.Estado === 1 ? <DeleteIcon /> : <RestoreIcon />}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {loadingSaveAll && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                bgcolor: "rgba(255,255,255,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
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
          onClose={() => setOpenDialogAgregar(false)}
          onSave={handleSaveTrabajo}
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
            display: "flex",
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


