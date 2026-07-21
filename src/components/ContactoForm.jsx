import React, { useState, useEffect, useRef } from "react";
import {
    TextField, Button, Box, Grid, Typography,
    useMediaQuery, useTheme, FormControlLabel, Checkbox, InputAdornment,
} from "@mui/material";
import { useInView } from "react-intersection-observer";
import emailjs from '@emailjs/browser';
import { motion } from "framer-motion";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

const MotionBox = motion.create(Box);

const fieldSx = (hasError) => ({
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 2,
    "& .MuiOutlinedInput-root": {
        color: "#E6EDF3",
        fontSize: "0.88rem",
        "& fieldset": { borderColor: hasError ? "#ff4d4f" : "rgba(255,255,255,0.12)" },
        "&:hover fieldset": { borderColor: hasError ? "#ff4d4f" : "rgba(99,179,237,0.6)" },
        "&.Mui-focused fieldset": { borderColor: hasError ? "#ff4d4f" : "#63B3ED", borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: hasError ? "#ff4d4f" : "rgba(255,255,255,0.45)", fontSize: "0.85rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: hasError ? "#ff4d4f" : "#63B3ED" },
    "& .MuiInputAdornment-root svg": { color: "rgba(255,255,255,0.3)", fontSize: "1.1rem" },
});

const ContactoForm = ({ setSnackbar }) => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [enviarCopia, setEnviarCopia] = useState(false);
    const [emailCopia, setEmailCopia] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!name.trim()) newErrors.name = true;
        if (!phone.trim()) newErrors.phone = true;
        if (!message.trim()) newErrors.message = true;
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSnackbar({ open: true, message: "Por favor, completa todos los campos.", type: "error" });
            return;
        }
        setErrors({});
        setIsSubmitting(true);
        const templateParams = {
            nombre: name, telefono: phone, mensaje: message,
            email: "plataformas.web.cl@gmail.com",
        };
        if (enviarCopia && emailCopia.trim()) templateParams.cc = emailCopia;
        emailjs.send("service_29hsjvu", "template_j4i5shl", templateParams, "IHD-e11j3sPmmvBA-")
            .then(() => {
                setSnackbar({ open: true, message: "¡Mensaje enviado con éxito a plataformas-web.cl! 📬", type: "success" });
                setName(""); setPhone(""); setMessage(""); setEmailCopia("");
                setIsSubmitting(false);
            })
            .catch((error) => {
                console.error("Error al enviar el correo:", error);
                setSnackbar({ open: true, message: "Ocurrió un error al enviar el mensaje 😥", type: "error" });
                setIsSubmitting(false);
            });
    };

    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
    const [startAnimation, setStartAnimation] = useState(false);
    useEffect(() => { if (inView) setTimeout(() => setStartAnimation(true), 600); }, [inView]);

    return (
        <Box>
            {/* ── Formulario ── */}
            <Box
                ref={formRef}
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: "flex", flexDirection: "column", gap: 2,
                    background: "rgba(10,18,35,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    p: { xs: 2.5, md: 3 },
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    opacity: isSubmitting ? 0.75 : 1,
                    transition: "opacity 0.3s",
                }}
            >
                <Grid container spacing={2}>
                    {/* Nombre */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="nombre"
                            label="Nombre / Apellido"
                            variant="outlined"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
                            error={Boolean(errors.name)}
                            disabled={isSubmitting}
                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon /></InputAdornment> }}
                            sx={fieldSx(errors.name)}
                        />
                    </Grid>

                    {/* Teléfono */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="telefono"
                            label="Teléfono"
                            variant="outlined"
                            fullWidth
                            value={phone}
                            onChange={(e) => { const v = e.target.value; if (/^\+?\d*$/.test(v) && v.length <= 12) setPhone(v); }}
                            inputProps={{ maxLength: 12 }}
                            error={Boolean(errors.phone)}
                            disabled={isSubmitting}
                            InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIphoneIcon /></InputAdornment> }}
                            sx={fieldSx(errors.phone)}
                        />
                    </Grid>

                    {/* Mensaje */}
                    <Grid item xs={12}>
                        <TextField
                            name="mensaje"
                            label="¿En qué podemos ayudarte?"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            error={Boolean(errors.message)}
                            disabled={isSubmitting}
                            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><ChatBubbleOutlineIcon /></InputAdornment> }}
                            sx={fieldSx(errors.message)}
                        />
                    </Grid>

                    {/* Copia correo */}
                    <Grid item xs={12}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={enviarCopia}
                                        onChange={(e) => setEnviarCopia(e.target.checked)}
                                        size="small"
                                        sx={{ color: "#63B3ED", "&.Mui-checked": { color: "#63B3ED" }, p: 0.25 }}
                                    />
                                }
                                label={<Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Quiero copia del mensaje</Typography>}
                                sx={{ ml: 0, mr: 0 }}
                            />
                            {enviarCopia && (
                                <TextField
                                    name="reply_to"
                                    label="Tu correo"
                                    variant="outlined"
                                    size="small"
                                    value={emailCopia}
                                    onChange={(e) => setEmailCopia(e.target.value)}
                                    disabled={isSubmitting}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: "1rem" }} /></InputAdornment> }}
                                    sx={{ ...fieldSx(false), flex: 1 }}
                                />
                            )}
                        </Box>
                    </Grid>

                    {/* Botón */}
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            endIcon={<SendRoundedIcon sx={{ fontSize: "1rem !important" }} />}
                            sx={{
                                py: 1.2, borderRadius: "12px",
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 700, fontSize: "0.92rem",
                                textTransform: "none", letterSpacing: "0.3px",
                                background: isSubmitting
                                    ? "rgba(255,255,255,0.1)"
                                    : "linear-gradient(90deg, #0075FF, #0055CC)",
                                color: "white",
                                boxShadow: "0 4px 20px rgba(0,117,255,0.35)",
                                transition: "all 0.25s",
                                "&:hover": {
                                    background: "linear-gradient(90deg, #1a85ff, #0066dd)",
                                    boxShadow: "0 6px 24px rgba(0,117,255,0.5)",
                                    transform: "translateY(-1px)",
                                },
                                "&:disabled": { opacity: 0.5 },
                            }}
                        >
                            {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* ── Cards soporte + WhatsApp ── */}
            <Box sx={{ mt: 2 }}>
                <MotionBox
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={startAnimation ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <Grid container spacing={2}>
                        {/* Soporte técnico */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                background: "linear-gradient(135deg, #fff5f5 0%, #fce8e8 100%)",
                                borderRadius: "16px", p: 2,
                                border: "1px solid rgba(225,37,27,0.15)",
                                display: "flex", flexDirection: "column", gap: 0.5,
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <img src="soporte-tecnico-1.png" alt="Soporte" loading="lazy" style={{ width: 26, objectFit: "contain" }} />
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#1f4f4f", letterSpacing: "0.5px" }}>
                                        Soporte técnico
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: "0.68rem", color: "#333", ml: 0.5, whiteSpace: "nowrap" }}>
                                    Escríbenos a <strong>plataformas.web.cl@gmail.com</strong>
                                </Typography>
                                <Button
                                    href="mailto:plataformas.web.cl@gmail.com"
                                    size="small" variant="text"
                                    sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#e1251b", textTransform: "none", alignSelf: "flex-start", p: 0, mt: 0.3, gap: 0.5, display: "inline-flex", alignItems: "center", "&:hover": { textDecoration: "underline", background: "transparent" } }}
                                >
                                    <SupportAgentIcon sx={{ fontSize: 16 }} />
                                    Escríbenos ahora
                                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                                </Button>
                            </Box>
                        </Grid>

                        {/* WhatsApp */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                background: "linear-gradient(135deg, #f0fff8 0%, #d4f5e9 100%)",
                                borderRadius: "16px", p: 2,
                                border: "1px solid rgba(18,140,126,0.2)",
                                display: "flex", flexDirection: "column", gap: 0.5,
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <img src="whatsapp-logo-icon.webp" alt="WhatsApp" loading="lazy" style={{ width: 26, objectFit: "contain" }} />
                                    <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#1f4f4f", letterSpacing: "0.5px" }}>
                                        WhatsApp
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: "0.68rem", color: "#333", ml: 0.5 }}>
                                    Escríbenos a <strong>+(569) 4687 3014</strong>
                                </Typography>
                                <Button
                                    href="https://api.whatsapp.com/send?phone=56946873014"
                                    target="_blank" size="small" variant="text"
                                    sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#128C7E", textTransform: "none", alignSelf: "flex-start", p: 0, mt: 0.3, gap: 0.5, display: "inline-flex", alignItems: "center", "&:hover": { textDecoration: "underline", background: "transparent" } }}
                                >
                                    <WhatsAppIcon sx={{ fontSize: 16 }} />
                                    Chatear ahora
                                    <ArrowForwardIcon sx={{ fontSize: 14 }} />
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </MotionBox>
            </Box>
        </Box>
    );
};

export default ContactoForm;
