import React, { useState, useEffect } from "react";
import { Snackbar, Alert, Slider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Slide, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

//COLORES PROGRESO
const getGradient = (val) => {
  if (val < 20) return "linear-gradient(90deg,#ff8a80,#e57373)"; // rojo suave
  if (val < 30) return "linear-gradient(90deg,#ef5350,#e53935)"; // rojo fuerte
  if (val < 70) return "linear-gradient(90deg,#ffb74d,#fb8c00)"; // naranjo
  return "linear-gradient(90deg,#81c784,#388e3c)"; // verde
};

export default function DialogAgregarTrabajo({ open, onClose, onSave, trabajoInicial, trabajoEditar }) {
  const modoEditar = !!trabajoEditar;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    trabajo: "",
    tipoApp: "1",
    progreso: 0,
    nombreCliente: "",
    emailCliente: "",
    telefonoCliente: "",
    logoCliente: "",
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onSave(form);
        setSuccess(false);
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose, onSave, form]);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      if (modoEditar) {
        setForm({
          trabajo: trabajoEditar.SitioWeb || "",
          tipoApp: String(trabajoEditar.TipoApp || trabajoEditar.tipoApp || "1"),
          progreso: Number(trabajoEditar.Porcentaje) || 0,
          nombreCliente: trabajoEditar.NombreCliente || "",
          emailCliente: trabajoEditar.EmailCliente || "",
          telefonoCliente: String(trabajoEditar.TelefonoCliente || ""),
          logoCliente: trabajoEditar.LogoCliente || "",
        });
      } else {
        setForm({
          trabajo: trabajoInicial?.Negocio || "",
          tipoApp: trabajoInicial?.tipoApp || "1",
          progreso: trabajoInicial?.Porcentaje || 0,
          nombreCliente: "",
          emailCliente: trabajoInicial?.EmailCliente || "",
          telefonoCliente: trabajoInicial?.TelefonoCliente || "",
          logoCliente: "",
        });
      }
    }
  }, [open, trabajoInicial, trabajoEditar, modoEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleSave = async () => {
    if (!form.trabajo || !form.tipoApp || !form.nombreCliente || !form.emailCliente || !form.telefonoCliente) {
      setSnackbar({ open: true, type: "error", message: "Completa todos los campos obligatorios" });
      return;
    }

    const base = window.location.hostname === "localhost" ? "http://localhost:8888" : "";

    try {
      setLoading(true);

      if (modoEditar) {
        const response = await fetch(`${base}/.netlify/functions/actualizarTrabajo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SitioWeb: trabajoEditar.SitioWeb,
            nuevoNombre: form.trabajo,
            nuevoTipoApp: form.tipoApp,
            nuevoPorcentaje: Number(form.progreso),
            nuevoNombreCliente: form.nombreCliente,
            nuevoEmailCliente: form.emailCliente,
            nuevoTelefonoCliente: form.telefonoCliente,
            nuevoLogoCliente: form.logoCliente,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al editar");
      } else {
        const response = await fetch(`${base}/.netlify/functions/agregarTrabajo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al guardar");
      }

      setLoading(false);
      setSuccess(true);

    } catch (error) {
      console.error("❌ Error al guardar:", error);
      setSnackbar({ open: true, type: "error", message: "Hubo un problema al guardar el trabajo." });
    } finally {
      setLoading(false);
    }
  };



  const fieldSx = {
    backgroundColor: "#fff",
    borderRadius: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      "&:hover fieldset": { borderColor: "#FB8C00" },
      "&.Mui-focused fieldset": { borderColor: "#F57C00", borderWidth: 2 },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#F57C00" },
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      scroll={isMobile ? "paper" : "body"}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          mt: { xs: 0, sm: -3 },
          borderRadius: { xs: 0, sm: 2 },
          border: "1px solid rgba(255,167,38,.35)",
          boxShadow: "0 24px 64px rgba(0,0,0,.45)",
          overflow: "hidden",
          height: { xs: "100dvh", sm: "auto" },
          maxHeight: { xs: "100dvh", sm: "90vh" },
          display: "flex",
          flexDirection: "column",
          "& .MuiDialogContent-root": { marginTop: 0 },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 700,
          color: "#FFF",
          fontFamily: "'Poppins', sans-serif",
          py: 2,
          borderBottom: "1px solid rgba(255,167,38,.35)",
          position: "relative",
          overflow: "hidden",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "url('/servicio1.webp')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,

            // Desktop
            backgroundSize: "130%",
            animation: "zoomInDesktop 2.5s ease-out forwards",

            // Mobile override
            "@media (max-width:600px)": {
              backgroundSize: "250%",              // 👈 inicia súper cerca
              animation: "zoomInMobile 2.5s ease-out forwards",
            },

            "@keyframes zoomInDesktop": {
              "0%": { backgroundSize: "150%" },
              "100%": { backgroundSize: "110%" },
            },
            "@keyframes zoomInMobile": {
              "0%": { backgroundSize: "270%" },   // 👈 más zoom inicial en mobile
              "100%": { backgroundSize: "140%" }, // 👈 termina aún con presencia
            },
          },

          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.45)", // overlay oscuro
            zIndex: 1,
          },

          "& > *": {
            position: "relative",
            zIndex: 2,
          },
        }}
      >

        {/* Botón cerrar */}
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#FFF",
            zIndex: 4, // 👈 más arriba que ::before y ::after
            "&:hover": { backgroundColor: "rgba(255,255,255,.15)" },

            // animación al abrir
            animation: open ? "spinTwice 0.6s ease-in-out" : "none",
            animationFillMode: "forwards",
            "@keyframes spinTwice": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(720deg)" },
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 28 }} />
        </IconButton>


        {/* Fila: ícono reloj + título */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 0.8, sm: 1.2 }, // espacio entre texto e ícono
            px: { xs: 1.2, sm: 2 },
            py: { xs: 0.5, sm: 0.8 },
            borderRadius: "999px",
            bgcolor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 4px 14px rgba(0,0,0,.35)",
          }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 800,
              letterSpacing: { xs: "0.3px", sm: "1px" },
              fontFamily: "'Poppins', sans-serif",
              color: "#fff",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            {success ? "¡Éxito!" : modoEditar ? "Editar Trabajo" : "Agregar Trabajo"}
          </Typography>

          {/* Ícono a la derecha */}
          <WorkOutlineIcon
            sx={{ color: "#fff", fontSize: { xs: 20, sm: 24 } }}
          />
        </Box>

      </DialogTitle>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="content"
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
          >
            <DialogContent
              dividers
              sx={{
                py: 3,
                pb: 5,
                bgcolor: success ? "#e6f4ea" : "#FFF8EC",
                position: "relative",
                overflow: "auto",
                flex: 1,
              }}
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }} // controla solo el colapso
                  >
                    <Box textAlign="center" sx={{ pt: 2 }}>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "#4caf50",
                            borderRadius: "50%",
                            width: 96,
                            height: 96,
                            mb: 2,
                            mt: 1, // 👈 agrega margen superior
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                          }}
                        >
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1 }}
                          >
                            <CheckIcon
                              sx={{
                                fontSize: 60,
                                color: "#fff",
                                transform: "translateY(2px)", // 👈 menos agresivo que 6px
                              }}
                            />
                          </motion.div>
                        </Box>
                      </motion.div>
                      <Typography variant="h6" fontWeight={700} color="success.dark">
                        Trabajo creado correctamente!
                      </Typography>
                    </Box>

                  </motion.div>
                ) : (

                  <Box display="flex" flexDirection="column" gap={2.5}>

                    {/* ── Sección: Trabajo ── */}
                    <Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#E65100", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                        🛠️ Datos del trabajo
                      </Typography>
                      <TextField
                        label="Nombre / Sitio Web"
                        name="trabajo"
                        value={form.trabajo}
                        onChange={handleChange}
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                      />
                    </Box>

                    {/* ── Sección: Cliente ── */}
                    <Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#E65100", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                        👤 Datos del cliente
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <TextField
                          label="Nombre Cliente *"
                          name="nombreCliente"
                          value={form.nombreCliente}
                          onChange={(e) => {
                            if (/^[a-zA-ZÀ-ÿ\s]*$/.test(e.target.value)) handleChange(e);
                          }}
                          size="small"
                          fullWidth
                          sx={fieldSx}
                        />

                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                          <TextField
                            label="Email *"
                            name="emailCliente"
                            type="email"
                            value={form.emailCliente}
                            onChange={handleChange}
                            size="small"
                            sx={{ ...fieldSx, flex: 1 }}
                            error={form.emailCliente !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailCliente)}
                            helperText={form.emailCliente !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailCliente) ? "Correo inválido" : ""}
                          />
                          <TextField
                            label="Teléfono *"
                            name="telefonoCliente"
                            type="tel"
                            value={form.telefonoCliente}
                            onChange={(e) => {
                              const onlyNums = e.target.value.replace(/\D/g, "");
                              setForm((prev) => ({ ...prev, telefonoCliente: onlyNums.slice(0, 12) }));
                            }}
                            size="small"
                            inputProps={{ inputMode: "numeric", maxLength: 12 }}
                            sx={{ ...fieldSx, flex: 1 }}
                          />
                        </Box>

                        <TextField
                          label="URL Logo"
                          name="logoCliente"
                          value={form.logoCliente}
                          onChange={handleChange}
                          size="small"
                          fullWidth
                          placeholder="https://ejemplo.com/logo.png"
                          sx={fieldSx}
                          InputProps={{
                            endAdornment: form.logoCliente ? (
                              <Box
                                component="img"
                                src={form.logoCliente}
                                alt="preview"
                                onError={(e) => { e.target.style.display = "none"; }}
                                onLoad={(e) => { e.target.style.display = "block"; }}
                                sx={{ width: 30, height: 30, borderRadius: 1, objectFit: "contain", border: "1px solid #eee", bgcolor: "#fff", flexShrink: 0 }}
                              />
                            ) : null,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* ── Sección: Tipo + Progreso ── */}
                    <Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#E65100", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                        💻 Tipo y progreso
                      </Typography>

                      {/* Tipo como chips */}
                      <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
                        {[
                          { val: "1", label: "🌐 Sitio Web", activeColor: "#1565C0", activeBg: "#E3F2FD", activeBorder: "#1976D2" },
                          { val: "2", label: "⚙️ Sistema",   activeColor: "#6A1B9A", activeBg: "#F3E5F5", activeBorder: "#7B1FA2" },
                        ].map(({ val, label, activeColor, activeBg, activeBorder }) => (
                          <Box
                            key={val}
                            onClick={() => setForm(p => ({ ...p, tipoApp: val }))}
                            sx={{
                              flex: 1, textAlign: "center", py: 0.9, borderRadius: 2,
                              cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                              border: form.tipoApp === val ? `2px solid ${activeBorder}` : "2px solid #e0e0e0",
                              bgcolor: form.tipoApp === val ? activeBg : "#fff",
                              color: form.tipoApp === val ? activeColor : "#999",
                              transition: "all 0.18s ease",
                              userSelect: "none",
                            }}
                          >
                            {label}
                          </Box>
                        ))}
                      </Box>

                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#E65100", mb: 1 }}>
                        📊 Progreso inicial: <strong>{form.progreso}%</strong>
                      </Typography>
                      <Slider
                        value={form.progreso}
                        onChange={(e, newValue) => handleChange({ target: { name: "progreso", value: newValue } })}
                        valueLabelDisplay="off"
                        step={5}
                        min={0}
                        max={100}
                        sx={{
                          "& .MuiSlider-track": { backgroundImage: getGradient(form.progreso), border: "none", height: 6 },
                          "& .MuiSlider-rail": { opacity: 0.25, backgroundColor: "#bbb", height: 6 },
                          "& .MuiSlider-thumb": { width: 18, height: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" },
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </AnimatePresence>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(3px)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            size={48}
            sx={{
              color: "warning.main",
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)", opacity: 1 },
                "50%": { transform: "scale(1.2)", opacity: 0.6 },
                "100%": { transform: "scale(1)", opacity: 1 },
              },
            }}
          />
        </Box>
      )}
      {/* FOOTER */}
      <DialogActions sx={{
        justifyContent: "center", py: 1.2, background: "linear-gradient(90deg,#FFF3E0,#FFE0B2)", borderTop: "1px solid rgba(255,167,38,.35)",
      }}>
        {success ? (
          <Button
            variant="contained"
            color="success"
            disabled
            sx={{ fontWeight: 700, textTransform: "none" }}
          >
            {modoEditar ? "Trabajo Actualizado ✓" : "Nuevo Trabajo Registrado💰"}
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              sx={{
                color: "#E65100",
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                minWidth: 160,
                border: "1px solid #E65100",
                "&:hover": { backgroundColor: "rgba(230,81,0,0.08)" },
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                minWidth: 160,
                background: modoEditar
                  ? "linear-gradient(90deg,#1565C0,#0D47A1)"
                  : "linear-gradient(90deg,#FF9800,#F57C00)",
                "&:hover": {
                  background: modoEditar
                    ? "linear-gradient(90deg,#1976D2,#1565C0)"
                    : "linear-gradient(90deg,#FFA726,#FB8C00)",
                },
              }}
            >
              {modoEditar ? "Guardar Cambios" : "Crear Trabajo"}
            </Button>
          </>
        )}
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.type}>{snackbar.message}</Alert>
      </Snackbar>
    </Dialog >
  );
}
