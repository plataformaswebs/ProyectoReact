import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Slide,
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Divider,
  Switch,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { motion, AnimatePresence } from "framer-motion";
import CheckIcon from "@mui/icons-material/Check";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const fieldSx = {
  backgroundColor: "#fff",
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": { borderColor: "#FFD54F" },
    "&.Mui-focused fieldset": { borderColor: "#FBC02D", borderWidth: 2 },
  },
};

const SectionTitle = ({ children }) => (
  <Typography
    variant="subtitle2"
    sx={{
      color: "#8D6E00",
      fontWeight: 700,
      mb: { xs: 0.5, sm: 1 },
      mt: { xs: 0, sm: 0.5 },
      display: "flex",
      alignItems: "center",
      gap: 0.6,
      fontSize: "0.8rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}
  >
    {children}
  </Typography>
);

export default function DialogAgregarCliente({ open, onClose, onSave, clienteEditar }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const modoEditar = !!clienteEditar;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });

  const emptyForm = {
    idCliente: "",
    nombreCliente: "",
    sitioWeb: "",
    URL: "",
    telefono: "",
    correo: "",
    pagado: 0,
    valor: "$10.000",
    fechaPago: "",
    estado: 1,
    logoCliente: "",
    internacional: 0,
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      if (clienteEditar) {
        setForm({
          idCliente: clienteEditar.idCliente || "",
          nombreCliente: clienteEditar.cliente || "",
          sitioWeb: clienteEditar.sitioWeb || "",
          URL: clienteEditar.url || clienteEditar.URL || "",
          telefono: String(clienteEditar.telefono || ""),
          correo: clienteEditar.correo || "",
          pagado: clienteEditar.pagado ? 1 : 0,
          valor: clienteEditar.valor || "$10.000",
          fechaPago: clienteEditar.fechaPago || "",
          estado: clienteEditar.estado ? 1 : 0,
          logoCliente: clienteEditar.logoCliente || "",
          internacional: clienteEditar.internacional ? 1 : 0,
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, clienteEditar]);

  useEffect(() => {
    if (success) {
      onSave(form);
      const timer = setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.nombreCliente || !form.sitioWeb || !form.URL || !form.telefono || !form.correo) {
      setSnackbar({ open: true, type: "error", message: "⚠️ Completa todos los campos obligatorios" });
      return;
    }

    try {
      setLoading(true);
      const base = window.location.hostname === "localhost" ? "http://localhost:8888" : "";
      const endpoint = modoEditar ? "editarCliente" : "agregarCliente";
      const url = `${base}/.netlify/functions/${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar");

      setSuccess(true);
      setSnackbar({
        open: true,
        type: "success",
        message: modoEditar ? "✅ Cliente actualizado correctamente" : "✅ Cliente agregado correctamente",
      });
    } catch (error) {
      console.error("❌ Error:", error);
      setSnackbar({ open: true, type: "error", message: "Hubo un problema al guardar el cliente." });
    } finally {
      setLoading(false);
    }
  };

  const accentColor = modoEditar ? "#1565C0" : "#B28704";

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
      fullScreen={isMobile && !success}
      maxWidth="sm"
      fullWidth={!isMobile || success}
      scroll="body"
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: isMobile && !success ? 0 : 3,
          border: isMobile && !success ? "none" : `1px solid ${modoEditar ? "rgba(66,165,245,.35)" : "rgba(129,245,180,.35)"}`,
          boxShadow: "0 24px 64px rgba(0,0,0,.45)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          ...(isMobile && !success && { height: "100dvh" }),
          ...(success && isMobile && { mx: 2 }),
        },
      }}
    >
      {/* ── HEADER ── */}
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 700,
          color: "#FFF",
          fontFamily: "'Poppins', sans-serif",
          py: 2,
          borderBottom: `2px solid ${modoEditar ? "rgba(66,165,245,0.35)" : "rgba(255,215,0,0.35)"}`,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: "url('/trabajo-terminado.webp')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
            backgroundSize: "130%",
            animation: "zoomInDesktop 2.5s ease-out forwards",
            "@media (max-width:600px)": {
              backgroundSize: "250%",
              animation: "zoomInMobile 2.5s ease-out forwards",
            },
            "@keyframes zoomInDesktop": {
              "0%": { backgroundSize: "150%" },
              "100%": { backgroundSize: "110%" },
            },
            "@keyframes zoomInMobile": {
              "0%": { backgroundSize: "270%" },
              "100%": { backgroundSize: "140%" },
            },
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            bgcolor: modoEditar ? "rgba(10,30,80,0.6)" : "rgba(80,50,0,0.55)",
            zIndex: 1,
          },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#FFF",
            zIndex: 6,
            "&:hover": { backgroundColor: "rgba(255,255,255,.2)" },
            animation: open ? "spinThrice 0.8s ease-in-out" : "none",
            animationFillMode: "forwards",
            "@keyframes spinThrice": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(1080deg)" },
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 26 }} />
        </IconButton>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            px: 2.5,
            py: 0.8,
            borderRadius: "999px",
            bgcolor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 4px 14px rgba(0,0,0,.35)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 800, letterSpacing: { xs: "0.3px", sm: "0.5px" }, fontFamily: "'Poppins', sans-serif", color: "#fff", fontSize: { xs: "1rem", sm: "1.2rem" } }}
          >
            {success ? "¡Éxito!" : modoEditar ? "Editar Cliente" : "Agregar Cliente"}
          </Typography>
          {modoEditar
            ? <EditRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            : <PersonAddRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          }
        </Box>
      </DialogTitle>

      {/* ── CONTENIDO ── */}
      <DialogContent
        sx={{
          py: { xs: 1.5, sm: 2 },
          px: { xs: 1.5, sm: 3 },
          bgcolor: "#FAFAFA",
          backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)",
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ textAlign: "center", padding: "32px 0" }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: modoEditar ? "#1976D2" : "#FFD54F",
                  borderRadius: "50%",
                  width: 88,
                  height: 88,
                  mb: 2,
                  boxShadow: `0 0 20px ${modoEditar ? "rgba(25,118,210,0.5)" : "rgba(255,215,0,0.6)"}`,
                }}
              >
                <CheckIcon sx={{ fontSize: 52, color: "#fff" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: accentColor }}>
                {modoEditar ? "🔄 ¡Cliente actualizado!" : "🎉 ¡Cliente agregado correctamente!"}
              </Typography>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Box display="flex" flexDirection="column" gap={{ xs: 1.5, sm: 2.5 }}>

                {/* DATOS PERSONALES */}
                <Box>
                  <SectionTitle>👤 Datos del Cliente</SectionTitle>
                  <Divider sx={{ mb: { xs: 1, sm: 1.5 }, borderColor: `${accentColor}44` }} />
                  <Box display="flex" flexDirection="column" gap={{ xs: 1, sm: 1.5 }}>
                    <TextField
                      label="Nombre Cliente *"
                      name="nombreCliente"
                      value={form.nombreCliente}
                      onChange={handleChange}
                      size="small"
                      fullWidth
                      sx={fieldSx}
                    />
                    <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
                      <TextField
                        label="Teléfono *"
                        name="telefono"
                        value={form.telefono}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setForm((p) => ({ ...p, telefono: val }));
                        }}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      />
                      <TextField
                        label="Correo *"
                        name="correo"
                        type="email"
                        value={form.correo}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* NEGOCIO */}
                <Box>
                  <SectionTitle>🏢 Información del Negocio</SectionTitle>
                  <Divider sx={{ mb: { xs: 1, sm: 1.5 }, borderColor: `${accentColor}44` }} />
                  <Box display="flex" flexDirection="column" gap={{ xs: 1, sm: 1.5 }}>
                    <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
                      <TextField
                        label="Sitio Web *"
                        name="sitioWeb"
                        value={form.sitioWeb}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                        placeholder="ejemplo.cl"
                        sx={fieldSx}
                      />
                      <TextField
                        label="URL *"
                        name="URL"
                        value={form.URL}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                        placeholder="https://ejemplo.cl"
                        sx={fieldSx}
                      />
                    </Box>
                    <Box display="flex" gap={1.5} flexDirection={{ xs: "column", sm: "row" }}>
                      <TextField
                        label="Valor mensual"
                        name="valor"
                        value={form.valor}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                        placeholder="$10.000"
                        sx={fieldSx}
                      />
                      <TextField
                        label="Logo Cliente (URL)"
                        name="logoCliente"
                        value={form.logoCliente}
                        onChange={handleChange}
                        size="small"
                        fullWidth
                        placeholder="https://..."
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
                </Box>

                {/* ESTADO */}
                <Box>
                  <SectionTitle>📊 Estado</SectionTitle>
                  <Divider sx={{ mb: { xs: 1, sm: 1.5 }, borderColor: `${accentColor}44` }} />
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography sx={{ fontWeight: 700, color: accentColor, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px" }}>¿Pagado?</Typography>
                    <Box display="flex" gap={1}>
                      {[
                        { val: 1, label: "✅ Pagado",    activeColor: "#1B5E20", activeBg: "#E8F5E9", activeBorder: "#388E3C" },
                        { val: 0, label: "❌ Sin pagar", activeColor: "#B71C1C", activeBg: "#FFEBEE", activeBorder: "#E53935" },
                      ].map(({ val, label, activeColor, activeBg, activeBorder }) => (
                        <Box
                          key={val}
                          onClick={() => setForm(p => ({ ...p, pagado: val }))}
                          sx={{
                            flex: 1, textAlign: "center", py: 0.9, borderRadius: 2,
                            cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                            border: form.pagado === val ? `2px solid ${activeBorder}` : "2px solid #e0e0e0",
                            bgcolor: form.pagado === val ? activeBg : "#fff",
                            color: form.pagado === val ? activeColor : "#999",
                            transition: "all 0.18s ease",
                            userSelect: "none",
                          }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>

                    <Typography sx={{ fontWeight: 700, color: accentColor, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.4px", mt: 0.5 }}>Estado</Typography>
                    <Box display="flex" gap={1}>
                      {[
                        { val: 1, label: "🟢 Activo",   activeColor: "#1B5E20", activeBg: "#E8F5E9", activeBorder: "#388E3C" },
                        { val: 0, label: "🔴 Inactivo",  activeColor: "#B71C1C", activeBg: "#FFEBEE", activeBorder: "#E53935" },
                      ].map(({ val, label, activeColor, activeBg, activeBorder }) => (
                        <Box
                          key={val}
                          onClick={() => setForm(p => ({ ...p, estado: val }))}
                          sx={{
                            flex: 1, textAlign: "center", py: 0.9, borderRadius: 2,
                            cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                            border: form.estado === val ? `2px solid ${activeBorder}` : "2px solid #e0e0e0",
                            bgcolor: form.estado === val ? activeBg : "#fff",
                            color: form.estado === val ? activeColor : "#999",
                            transition: "all 0.18s ease",
                            userSelect: "none",
                          }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>

                {/* INTERNACIONAL */}
                <Box
                  sx={{
                    borderRadius: 2,
                    border: form.internacional
                      ? "1.5px solid rgba(33,150,243,0.5)"
                      : "1.5px solid rgba(0,0,0,0.1)",
                    background: form.internacional
                      ? "linear-gradient(135deg, rgba(33,150,243,0.08), rgba(100,181,246,0.12))"
                      : "rgba(0,0,0,0.02)",
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.8, sm: 1.2 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    transition: "all 0.3s ease",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: form.internacional ? "#1565C0" : "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.6,
                      }}
                    >
                      🌍 Cliente Internacional
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#888", mt: 0.2 }}>
                      {form.internacional ? "Pagos vía PayPal 🅿️" : "Pagos locales (Chile 🇨🇱)"}
                    </Typography>
                  </Box>
                  <Switch
                    checked={!!form.internacional}
                    onChange={(e) => setForm((p) => ({ ...p, internacional: e.target.checked ? 1 : 0 }))}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#1976D2" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#1976D2" },
                    }}
                  />
                </Box>

              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {/* ── FOOTER ── */}
      <DialogActions
        sx={{
          justifyContent: "stretch",
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.2, sm: 2 },
          gap: 1.5,
          background: modoEditar
            ? "linear-gradient(90deg, #E3F2FD, #BBDEFB)"
            : "linear-gradient(90deg, #FFF8E1, #FFECB3, #FFE082)",
          borderTop: `1px solid ${modoEditar ? "rgba(66,165,245,0.35)" : "rgba(255,215,0,0.35)"}`,
          flexShrink: 0,
        }}
      >
        {success ? (
          <Button
            fullWidth
            variant="contained"
            disabled
            sx={{
              fontWeight: 700,
              textTransform: "none",
              py: 1.2,
              background: modoEditar
                ? "linear-gradient(135deg, #42A5F5, #1976D2)"
                : "linear-gradient(135deg, #FFD54F, #FBC02D)",
              color: "#fff",
            }}
          >
            {modoEditar ? "Cliente Actualizado 🔄" : "Cliente Agregado 💛"}
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              fullWidth
              variant="outlined"
              sx={{
                color: accentColor,
                fontWeight: 700,
                textTransform: "none",
                py: { xs: 0.8, sm: 1.1 },
                borderColor: accentColor,
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", borderColor: accentColor },
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
              disabled={loading}
              sx={{
                position: "relative",
                overflow: "hidden",
                textTransform: "none",
                fontWeight: 700,
                py: { xs: 0.8, sm: 1.1 },
                color: "#fff",
                background: modoEditar
                  ? "linear-gradient(135deg, #1565C0, #1976D2, #42A5F5)"
                  : "linear-gradient(135deg, #FFD54F, #FFB300, #FFA000)",
                boxShadow: modoEditar ? "0 0 12px rgba(25,118,210,0.4)" : "0 0 12px rgba(255,215,0,0.4)",
                "&:hover": {
                  background: modoEditar
                    ? "linear-gradient(135deg, #1976D2, #1E88E5, #64B5F6)"
                    : "linear-gradient(135deg, #FFEE58, #FFC107, #FFB300)",
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(130deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
                  transform: "translateX(-100%)",
                  animation: "shineDiagonal 4s ease-in-out infinite",
                  pointerEvents: "none",
                  "@keyframes shineDiagonal": {
                    "0%": { transform: "translateX(-120%)" },
                    "100%": { transform: "translateX(120%)" },
                  },
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : modoEditar ? (
                "Guardar Cambios"
              ) : (
                "Crear Cliente"
              )}
            </Button>
          </>
        )}
      </DialogActions>

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(3px)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress color={modoEditar ? "primary" : "warning"} size={48} />
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.type}>{snackbar.message}</Alert>
      </Snackbar>
    </Dialog>
  );
}
