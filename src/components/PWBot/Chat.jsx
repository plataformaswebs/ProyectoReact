import { Box, Paper, Typography, Dialog, DialogContent, DialogActions, Button, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTenant } from "./TenantContext";
import ChatContainer from "./ChatContainer";
import ChatInput from "./ChatInput";
import { useState, useEffect } from "react";

export default function Chat({ onClose }) {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const tenant = useTenant();
    const [welcomeOpen, setWelcomeOpen] = useState(true);
    const [spin, setSpin] = useState(false);
    const [starting, setStarting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [lead, setLead] = useState({
        offer: null,
        email: null,
        business: null,
        sent: false,
    });
    const [messages, setMessages] = useState([
        { from: "bot", text: tenant.welcomeMessage },
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    from: "bot",
                    text: `ℹ️Precio Mercado $300.000 CLP

*Oferta 1: Pago único*
💰 Reserva inicial: $29.990 CLP
💵 Pago final: $70.000 CLP
🧾 Inversión total: $99.990 CLP
⏱️ Tiempo de desarrollo: 3 a 7 días

*Oferta 2: Suscripción mensual*
🚀 Desarrollo inicial: $29.990 CLP
📆 Suscripción mensual: $9.990 CLP
⚡ Tiempo de desarrollo: 72 hrs

¿Cuál oferta te interesa más? 😊`
                }
            ]);
        }, 800); // 0.8 segundos después

        return () => clearTimeout(timer);
    }, []);
    const handleSend = async (text) => {
        const userMessage = {
            from: "user",
            text,
            timestamp: new Date(),
        };

        // 🧠 Detectar selección de oferta
        if (/oferta\s*1|la\s*1|opción\s*1/i.test(text)) {
            setLead((prev) => ({
                ...prev,
                offer: "Oferta 1 - Pago único",
            }));
        }

        if (/oferta\s*2|la\s*2|opción\s*2/i.test(text)) {
            setLead((prev) => ({
                ...prev,
                offer: "Oferta 2 - Suscripción mensual",
            }));
        }

        // 📧 Detectar correo
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
            setLead((prev) => ({
                ...prev,
                email: text,
            }));
        }

        // 🏷️ Detectar nombre del negocio (solo después del correo)
        if (
            lead.email &&
            !lead.business &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ) {
            setLead((prev) => ({
                ...prev,
                business: text,
            }));
        }

        // 🔑 Construir historial
        const updatedMessages = [...messages, userMessage];

        // UI inmediata
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                    desdeSitioWeb: true,
                }),
            });

            const data = await res.json();
            const replies = Array.isArray(data.replies)
                ? data.replies
                : [];

            setIsTyping(false);

            setMessages((prev) => {
                const newMessages = [...prev];

                replies.forEach((r) => {
                    const botText = r.text || "";
                    const lowerText = botText.toLowerCase();

                    // 1️⃣ Mensaje normal del bot
                    newMessages.push({
                        from: "bot",
                        text: botText,
                        image: r.image,
                        video: r.video,
                        timestamp: new Date(),
                    });

                    // 2️⃣ Trigger James (video)
                    if (lowerText.includes("james es el perrito")) {
                        newMessages.push({
                            from: "bot",
                            video: "/james.mp4",
                            timestamp: new Date(),
                        });
                    }

                    // 3️⃣ Trigger Maivelyn Sanchez (imagen)
                    if (lowerText.includes("maivelyn sanchez")) {
                        newMessages.push({
                            from: "bot",
                            image: "/fondo_adm.jpeg", // debe estar en /public
                            timestamp: new Date(),
                        });
                    }
                });

                return newMessages;
            });

        } catch (e) {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    from: "bot",
                    text: "⚠️ Error al contactar la IA",
                    timestamp: new Date(),
                },
            ]);
        }
    };

    useEffect(() => {
        const handleClose = () => setOpenChat(false);
        window.addEventListener("closeChat", handleClose);
        return () => window.removeEventListener("closeChat", handleClose);
    }, []);

    useEffect(() => {
        setSpin(true);
    }, []);

    return (
        <Box
            sx={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: "transparent",
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: { xs: "100%", md: 600 },
                    height: { xs: "75vh", md: 600 },
                    maxHeight: { xs: "75vh", md: 600 },
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: { xs: "20px", md: "12px" },
                }}
            >
                {/* Header del chat */}
                <Box
                    sx={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.5,
                        color: "white",
                        background:
                            "linear-gradient(270deg, #0f3c4c, #1b6f8a, #0f3c4c)",
                        backgroundSize: "400% 400%",
                        animation: "headerFlow 8s ease infinite",
                        position: "relative",

                        "@keyframes headerFlow": {
                            "0%": { backgroundPosition: "0% 50%" },
                            "50%": { backgroundPosition: "100% 50%" },
                            "100%": { backgroundPosition: "0% 50%" },
                        },
                    }}
                >
                    {/* Avatar con pulso */}
                    <Box
                        sx={{
                            position: "relative",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            flexShrink: 0,

                            /* Pulso visible */
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: "-4px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.35)",
                                animation: "pulse 2s infinite",
                            },

                            "@keyframes pulse": {
                                "0%": {
                                    transform: "scale(1)",
                                    opacity: 0.6,
                                },
                                "70%": {
                                    transform: "scale(1.6)",
                                    opacity: 0,
                                },
                                "100%": {
                                    opacity: 0,
                                },
                            },
                        }}
                    >
                        {/* Imagen */}
                        <Box
                            component="img"
                            src="/plataformas-web-img.jpeg"
                            alt="Plataformas Web"
                            sx={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid white",
                                position: "relative",
                                zIndex: 1,
                            }}
                        />

                        {/* Badge online */}
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: -1,
                                right: -1,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: "#22c55e",
                                border: "2px solid #075e54",
                                boxShadow: "0 0 8px rgba(34,197,94,0.9)",
                                zIndex: 2,
                            }}
                        />
                    </Box>

                    {/* Nombre */}
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            letterSpacing: 0.4,
                            textShadow: "0 0 6px rgba(255,255,255,0.6)",
                        }}
                    >
                        {tenant.name}
                    </Typography>
                    {/* Botón cerrar */}
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: "#fff",
                            ml: "auto",
                            backgroundColor: "rgba(255,255,255,0.15)",
                            animation: spin ? "spinTwice 0.6s ease-in-out" : "none",

                            "@keyframes spinTwice": {
                                "0%": { transform: "rotate(0deg)" },
                                "100%": { transform: "rotate(720deg)" }, // 2 vueltas
                            },

                            "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.25)",
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>



                {/* 👇 Este debe ocupar el espacio sobrante */}
                <ChatContainer messages={messages} isTyping={isTyping} />

                {/* 👇 Este debe quedar pegado abajo */}
                <ChatInput onSend={handleSend} />
            </Paper>
        </Box>

    );

}
