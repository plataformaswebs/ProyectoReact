import React, { useEffect, useState, useRef } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Slide, Button, Typography, TextField, InputAdornment,
  CircularProgress, useTheme, useMediaQuery, Box
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { supabase } from "../supabase/client";
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

const PAYPAL_TEST_CLIENT_IDS = new Set([1, 8, 9]);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function DialogOneClickMall({
  open,
  onClose,
  onConfirm,
  primaryLabel = "Suscribirse con Webpay",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const sitioRef = useRef();

  const [showContent, setShowContent] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sitioWeb, setSitioWeb] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [sitioValido, setSitioValido] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);  // Estado para controlar la redirecciÃ³n
  const esInternacional = cliente?.internacional === true;
  const esClientePaypalPrueba = PAYPAL_TEST_CLIENT_IDS.has(Number(cliente?.idCliente));

  useEffect(() => {
    let timer;

    if (open) {
      setShowContent(false);
      setLoading(false);
      setError("");
      setTouched(false);
      setSitioWeb("");
      setSitioValido(false);
      setCliente(null);
      setArmed(false);
      setIsRedirecting(false);
      timer = setTimeout(() => {
        setShowContent(true);
        setArmed(true);
      }, 350);
    } else {
      setShowContent(false);
    }

    return () => clearTimeout(timer);
  }, [open]);



  // ðŸ" Validar sitio web y buscar en Excel (LOCK REAL)
  const handleValidateWebsite = async () => {
    if (sitioWeb.trim()) setTouched(true);

    setError("");
    setSitioValido(false);
    setCliente(null);

    if (!sitioWeb) {
      setError("Debes ingresar la URL de tu sitio web");
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;
    if (!urlPattern.test(sitioWeb)) {
      setError("Ingresa una URL válida (ej: tusitio.cl)");
      return;
    }

    setLoadingCheck(true);

    try {
      const dominioIngresado = sitioWeb
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "")
        .toLowerCase()
        .trim();

      const { data: listaClientes, error: dbError } = await supabase
        .from('clientes')
        .select('id, nombre, correo, sitio_web, logo_url, internacional')
        .eq('estado', true);

      if (dbError) throw dbError;

      const encontrado = (listaClientes || []).find((c) => {
        if (!c.sitio_web) return false;

        const dominioCliente = c.sitio_web
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "")
          .toLowerCase()
          .trim();

        return (
          dominioCliente === dominioIngresado ||
          dominioIngresado.endsWith("." + dominioCliente) ||
          dominioCliente.endsWith("." + dominioIngresado)
        );
      });

      if (!encontrado) {
        console.warn("Cliente NO encontrado para dominio:", dominioIngresado);
        setError("No se encontró el Cliente en la base de datos.");
        return;
      }

      console.log(
        `VALIDACIÓN EXITOSA ID: ${encontrado.id} | Cliente: ${encontrado.nombre} | Internacional: ${encontrado.internacional}`
      );

      setCliente({
        nombre: encontrado.nombre,
        correo: encontrado.correo,
        idCliente: encontrado.id,
        logoCliente: encontrado.logo_url,
        internacional: encontrado.internacional === true,
        paypalPlanMode:
          encontrado.internacional === true && PAYPAL_TEST_CLIENT_IDS.has(Number(encontrado.id))
            ? "test"
            : "standard",
      });

      setSitioValido(true);

    } catch (err) {
      console.error("Error validando cliente:", err);
      setError("Error interno validando cliente. Contactar soporte.");
    } finally {
      setLoadingCheck(false);
    }
  };
  const handleConfirm = async () => {
    if (!sitioValido || !cliente) {
      setError("Debes ingresar un sitio vÃ¡lido y con cliente asociado");
      return;
    }

    // Mantiene el diÃ¡logo abierto, solo cambia al modo â€œcargandoâ€
    setLoading(true);
    setShowContent(false); // Oculta el contenido del dialogo
    setIsRedirecting(true); // Activa la redirecciÃ³n

    try {
      sessionStorage.setItem("sitioWebReserva", sitioWeb);
      sessionStorage.setItem("clienteNombre", cliente.nombre);
      sessionStorage.setItem("clienteCorreo", cliente.correo);
      sessionStorage.setItem("clienteId", cliente.idCliente);
      sessionStorage.setItem("logoCliente", cliente.logoCliente);
      sessionStorage.setItem("paypalPlanMode", cliente.paypalPlanMode || "standard");
      sessionStorage.setItem("esClientePaypalPrueba", esClientePaypalPrueba ? "1" : "0");
      // Llamar al backend (Netlify function suscribirse)
      const result = await onConfirm?.(sitioWeb, cliente);

      if (result?.tipo === "paypal" && result?.approvalUrl) {
        console.log("Redirigiendo a PayPal...");
        onClose?.();
        setTimeout(() => {
          window.location.href = result.approvalUrl;
        }, 1000);
        return;
      }

      if (result?.tipo === "webpay" && result?.url && result?.token) {
        console.log("Redirigiendo a Transbank...");
        onClose?.();
        setTimeout(() => {
          window.location.href = `${result.url}?TBK_TOKEN=${result.token}`;
        }, 1000);
        return;
      }

      // Compatibilidad con respuesta antigua
      if (result?.url_webpay && result?.token) {
        console.log("Redirigiendo a Transbank...");
        onClose?.();
        setTimeout(() => {
          window.location.href = `${result.url_webpay}?TBK_TOKEN=${result.token}`;
        }, 1000);
        return;
      }

      throw new Error("No se recibio una respuesta válida desde el backend");
    }
    catch (error) {
      console.error("Error en onConfirm:", error);
      setError("");
      setShowContent(true);
      setLoading(false);
      setIsRedirecting(false); // Desactiva el estado de redirecciÃ³n
    }
  };

  // Detectar /suscribir
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.pathname.includes("/suscribir")) {
      const timer = setTimeout(() => {
        setAutoOpen(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog
      open={open || loading}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      TransitionComponent={Transition}
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-start", sm: "center" }, // ðŸ"± arriba, ðŸ–¥ï¸ centrado
        },
      }}
      PaperProps={{
        sx: {
          mt: { xs: 5, sm: 0 },
          borderRadius: 2,
          border: "1px solid rgba(106,27,154,.35)",
          boxShadow: "0 24px 64px rgba(0,0,0,.45)",
          overflow: "hidden",
          background: "linear-gradient(180deg,#F3E5F5 0%,#EDE7F6 100%) !important",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: 90, sm: 150 },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/fondo-transbank.webp')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            transform: "scale(1.2)",
            animation: "bgZoom 1s ease-out forwards",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 100%)",
          },
          "& > *": { position: "relative", zIndex: 2 },
          "@keyframes bgZoom": {
            "0%": { transform: "scale(1.2)" },
            "100%": { transform: "scale(1)" },
          },
        }}
      >
        {/* BotÃ³n cerrar */}
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          disabled={loading}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: loading ? "rgba(255,255,255,0.4)" : "#FFF",
            zIndex: 4,
            cursor: loading ? "not-allowed" : "pointer",
            pointerEvents: loading ? "none" : "auto",
            "&:hover": {
              backgroundColor: loading ? "transparent" : "rgba(255,255,255,.15)",
            },
            animation: open ? "spinTwice 0.6s ease-in-out" : "none",
            "@keyframes spinTwice": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(720deg)" },
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 28 }} />
        </IconButton>

        {/* TÃ­tulo */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontWeight: 800,
            fontFamily: "'Poppins', sans-serif",
            color: "#fff",
            fontSize: loading
              ? { xs: "0.85rem", sm: "1.15rem" }
              : { xs: "0.9rem", sm: "1.4rem" },
            px: 3,
            py: 0.5,
            mt: 1.5,
            borderRadius: "999px",
            border: "2px solid rgba(255,255,255,0.3)",
            backgroundColor: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          <motion.span
            key={loading ? "webpay" : "cart"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {loading ? (esInternacional ? "\uD83D\uDCB8" : "\uD83D\uDCB3") : "\uD83D\uDD14"}
          </motion.span>

          {loading ? (esInternacional ? "Redirigiendo a PayPal..." : "Redirigiendo a WebPay...") : ("Suscripción Mensual")}
        </Typography>
      </DialogTitle>

      <AnimatePresence mode="wait">
        {showContent && !isRedirecting && (
          <motion.div
            key="dialogContent"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
            }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.6 } }}
            style={{
              overflow: "hidden",
              transformOrigin: "top center",
              willChange: "opacity, height",
            }}
          >

            <DialogContent
              sx={{
                background: "linear-gradient(180deg,#F3E5F5 0%,#EDE7F6 100%)",
                px: { xs: 2, sm: 4 },
                pb: { xs: 1, sm: 3 },
                pt: { xs: 1, sm: 3 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  mb: 2,
                  textAlign: "center",
                  fontWeight: 500,
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  lineHeight: 1.3,
                }}
              >
                {"\u2728"} Ingresa tu Sitio web de producción.
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    fontSize: { xs: "0.75rem", sm: "0.9rem" },
                    color: "#6A1B9A",
                    mt: 0.1, // ðŸ'ˆ mÃ¡s junto al texto superior
                    fontWeight: 400,
                  }}
                >
                  (Ejemplo: plataformas-web.cl)
                </Box>
              </Typography>

              {/* Sitio Web */}
              <TextField
                inputRef={sitioRef}
                label="Sitio Web"
                placeholder="tusitio.cl"
                value={sitioWeb}
                onChange={(e) => setSitioWeb(e.target.value.trim())}
                onBlur={handleValidateWebsite}
                fullWidth
                required
                autoFocus
                size="medium"
                error={Boolean(error) && touched}
                helperText={touched && error ? error : " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {loadingCheck ? (
                        <CircularProgress size={22} />
                      ) : sitioValido ? (
                        <Box sx={{ color: "#2e7d32", mr: 1.5 }}>{"\u2714"}</Box>
                      ) : (
                        <Box sx={{ color: "#6A1B9A", mr: 1.5 }}>{"\uD83C\uDF10"}</Box>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
              />

              {/* Cliente encontrado */}
              {cliente && (
                <motion.div
                  key="cliente-info"
                  initial={{ opacity: 0, y: 25, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] },
                  }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.4 } }}
                  style={{ width: "100%" }}
                >
                  {/* ðŸ"' TÃ­tulo centrado */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mt: -2.5,
                      mb: 0,
                      fontWeight: 700,
                      color: "#4A148C",
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      letterSpacing: 0.3,
                      textAlign: "center",
                    }}
                  >
                    Cliente - Plataformas web
                  </Typography>

                  {/* ðŸ"² Contenedor del cliente */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: 0.15, duration: 0.6 },
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        p: 2.2,
                        borderRadius: 3,
                        background: "linear-gradient(180deg, #FFFFFF 0%, #F7F2FB 100%)",
                        border: "1.5px solid rgba(106,27,154,0.25)",
                        boxShadow: "0 4px 10px rgba(106,27,154,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      {/* ðŸ"¹ Borde superior animado */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: 4,
                          width: "100%",
                          background:
                            "linear-gradient(90deg, #6A1B9A 0%, #8E24AA 50%, #BA68C8 100%)",
                          animation: "flow 5s linear infinite",
                          "@keyframes flow": {
                            "0%": { backgroundPosition: "0% 0%" },
                            "100%": { backgroundPosition: "200% 0%" },
                          },
                          backgroundSize: "200% auto",
                        }}
                      />

                      {/* âœ… Franja de estado animada */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 1,
                          transition: { delay: 0.3, duration: 0.6 },
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: 4,
                            left: 0,
                            width: "100%",
                            textAlign: "center",
                            py: 0.35,
                            backgroundColor: "rgba(76,175,80,0.08)",
                            color: "#2E7D32",
                            fontSize: "0.72rem",
                            fontWeight: 500,
                            letterSpacing: 0.3,
                            borderBottom: "1px solid rgba(46,125,50,0.15)",
                          }}
                        >
                          {"\u2705"} Identidad verificada con éxito
                        </Box>
                      </motion.div>

                      {/* ðŸ'¤ Datos principales */}
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            color: "#212121",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            mb: 0.4,
                          }}
                        >
                          {"\uD83D\uDC64"} <Box component="span">{cliente.nombre}</Box>
                        </Typography>

                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: "0.8rem", sm: "0.9rem" },
                            color: "#6A1B9A",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                            wordBreak: "break-all",
                          }}
                        >
                          {"\u2709\uFE0F"} <Box component="span">{cliente.correo}</Box>
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>

                  {/* ðŸ"' Mensaje de confianza WebPay (sin cambios, solo animado al aparecer) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: 0.3, duration: 0.5 },
                    }}
                  >
                    {/* ðŸ"' Mensaje de confianza WebPay */}
                    <Box
                      sx={{
                        width: "100%",
                        mt: 0.5,
                        px: 1.8,
                        py: 1.2,
                        borderRadius: 2.5,
                        background: "linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 100%)",
                        border: "1px solid rgba(106,27,154,0.25)",
                        boxShadow: "0 3px 8px rgba(106,27,154,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.2,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* ðŸ" Texto informativo */}
                      <Box
                        sx={{
                          flex: "1 1 65%",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.4,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: "0.68rem", sm: "0.75rem" },
                            color: "#6A1B9A",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                          }}
                        >
                          {esInternacional ? <>{"\uD83D\uDCB8"} Pago seguro con <strong>PayPal.</strong></> : <>{"\uD83D\uDCB3"} Pago seguro con <strong>WebPay.</strong></>}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: { xs: "0.68rem", sm: "0.75rem" },
                            color: "#6A1B9A",
                            fontWeight: 400,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                          }}
                        >
                          {esInternacional ? <>{"\uD83D\uDD10"} Datos protegidos por <strong>PayPal.</strong></> : <>{"\uD83D\uDD10"} Datos protegidos por <strong>Transbank.</strong></>}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: { xs: "0.68rem", sm: "0.75rem" },
                            color: "#6A1B9A",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                          }}
                        >
                          {esInternacional ? <>{"\uD83D\uDD01"} {"Suscripción Mensual: "}<strong>{esClientePaypalPrueba ? "$0.01 USD." : "$10 USD."}</strong></> : <>{"\uD83D\uDD01"} {"Suscripci\u00F3n Mensual: "}<strong>$9.990 CLP.</strong></>}
                        </Typography>
                      </Box>

                      {/* ðŸ'¡ï¸ Escudo protector animado con pulso */}
                      <Box
                        sx={{
                          flex: "0 0 auto",
                          position: "relative",
                          width: { xs: 50, sm: 64 },
                          height: { xs: 56, sm: 70 },
                          mt: { xs: 0, sm: 0 },
                          mx: { xs: "auto", sm: 0 },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {/* ðŸ"° Capa del escudo principal */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            clipPath:
                              "polygon(50% 0%, 100% 25%, 88% 90%, 50% 100%, 12% 90%, 0% 25%)",
                            background: "linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)",
                            boxShadow: "0 0 12px rgba(106,27,154,0.25)",
                            animation: "shieldPulse 2.8s ease-in-out infinite",
                            "@keyframes shieldPulse": {
                              "0%": { transform: "scale(1)", boxShadow: "0 0 10px rgba(106,27,154,0.35)" },
                              "50%": { transform: "scale(1.05)", boxShadow: "0 0 24px rgba(106,27,154,0.55)" },
                              "100%": { transform: "scale(1)", boxShadow: "0 0 10px rgba(106,27,154,0.35)" },
                            },
                            transition: "all 0.3s ease",
                          }}
                        />

                        {/* âœ¨ Capa interna mÃ¡s clara (profundidad visual) */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: "4px",
                            clipPath:
                              "polygon(50% 0%, 100% 25%, 88% 90%, 50% 100%, 12% 90%, 0% 25%)",
                            background: "linear-gradient(180deg, #FFFFFF 0%, #F3E5F5 100%)",
                            border: "1.5px solid rgba(106,27,154,0.3)",
                            boxShadow: "inset 0 0 6px rgba(106,27,154,0.15)",
                            borderRadius: 2,
                          }}
                        />

                        {/* ðŸ"' Candado central */}
                        <Typography
                          sx={{
                            position: "relative",
                            fontSize: { xs: "1.6rem", sm: "2rem" },
                            color: "#4A148C",
                            zIndex: 2,
                            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            animation: "lockPulse 2.8s ease-in-out infinite",
                            "@keyframes lockPulse": {
                              "0%": { opacity: 1 },
                              "50%": { opacity: 0.8 },
                              "100%": { opacity: 1 },
                            },
                          }}
                        >
                          {"\uD83D\uDD12"}
                        </Typography>
                      </Box>


                    </Box>
                  </motion.div>
                </motion.div>
              )}

            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>

      <DialogActions
        sx={{
          px: 2,
          py: 1.2,
          background: "linear-gradient(90deg,#E1BEE7,#CE93D8)",
          borderTop: "1px solid rgba(106,27,154,.35)",
          display: "flex",
          justifyContent: "center", // ðŸ'ˆ centra horizontalmente
          alignItems: "center",
          gap: 1.5, // ðŸ'ˆ separaciÃ³n equilibrada
        }}
      >
        {/* BotÃ³n Cancelar */}
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: loading ? "#9c9c9c" : "#4A148C",
            fontWeight: 700,
            textTransform: "none",
            minWidth: 95,
            mr: -2,
          }}
        >
          Cancelar
        </Button>

        {/* BotÃ³n dinÃ¡mico: Validar / "Suscribirse" */}
        <Button
          variant="contained"
          onClick={sitioValido && cliente ? handleConfirm : handleValidateWebsite}
          disabled={loading || (!sitioWeb && !(sitioValido && cliente))}
          sx={{
            position: "relative",
            overflow: "hidden", // para que el brillo no se salga
            height: 42,
            minWidth: 170,
            textTransform: "none",
            fontWeight: 700,
            color: "#fff",
            background:
              sitioValido && cliente
                ? "linear-gradient(135deg, #FFD700 0%, #FFC107 40%, #FFB300 70%, #FFD54F 100%)"
                : "linear-gradient(90deg,#6A1B9A,#8E24AA)",
            boxShadow:
              sitioValido && cliente
                ? "0 0 16px rgba(255,215,0,0.6)"
                : "0 6px 18px rgba(106,27,154,.35)",
            opacity: sitioWeb || (sitioValido && cliente) ? 1 : 0.5,
            transition: "all 0.3s ease",
            border:
              sitioValido && cliente
                ? "1px solid rgba(255,255,255,0.4)"
                : "1px solid transparent",
            "&:hover": {
              background:
                sitioValido && cliente
                  ? "linear-gradient(135deg, #FFEB3B 0%, #FFC107 40%, #FFA000 70%, #FFEE58 100%)"
                  : "linear-gradient(90deg,#7B1FA2,#9C27B0)",
              boxShadow:
                sitioValido && cliente
                  ? "0 0 24px rgba(255,235,59,0.85)"
                  : "0 6px 18px rgba(106,27,154,.35)",
            },
            "&:active": {
              transform: "scale(0.98)",
              boxShadow:
                sitioValido && cliente
                  ? "0 0 10px rgba(255,215,0,0.4)"
                  : "0 4px 12px rgba(106,27,154,.35)",
            },
          }}
        >
          {/* âœ¨ Brillo diagonal animado */}
          {sitioValido && cliente && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: "-75%",
                width: "50%",
                height: "100%",
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.0) 100%)",
                transform: "skewX(-25deg)",
                animation: "shine 3.2s infinite",
                "@keyframes shine": {
                  "0%": { left: "-75%" },
                  "60%": { left: "130%" },
                  "100%": { left: "130%" },
                },
              }}
            />
          )}

          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : sitioValido && cliente ? (
            <>
              <NotificationsNoneIcon
                sx={{
                  fontSize: 21,
                  verticalAlign: "middle",
                }}
              />
              Suscribirse
            </>
          ) : (
            "Validar Sitio Web"
          )}
        </Button>
      </DialogActions>
    </Dialog >
  );
}





































