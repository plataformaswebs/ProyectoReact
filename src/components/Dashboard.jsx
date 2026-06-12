import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Typography,
    useMediaQuery,
    useTheme, Snackbar, Alert, Switch, FormControlLabel
} from "@mui/material";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import DialogPaseMensual from "./DialogPaseMensual";
import MenuInferior from './configuraciones/MenuInferior';

const Contador = ({ valorFinal, texto, subtexto, delay = 0, variant = "h5", iniciar }) => {
    const [valor, setValor] = useState(0);

    useEffect(() => {
        if (!iniciar) return;

        let start = 0;
        const duration = 2000;
        const steps = 60;
        const increment = valorFinal / steps;
        const stepTime = duration / steps;

        if (valorFinal === 0) {
            setValor(0);
            return;
        }

        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                start += increment;
                const nuevoValor = Math.ceil(start);
                if (nuevoValor >= valorFinal) {
                    setValor(valorFinal);
                    clearInterval(interval);
                } else {
                    setValor(nuevoValor);
                }
            }, stepTime);
        }, delay);

        return () => clearTimeout(timeout);
    }, [valorFinal, delay, iniciar]);

    return (
        <Box sx={{ textAlign: "center" }}>
            <Typography
                variant={variant}
                sx={{ fontWeight: 800, lineHeight: 1, letterSpacing: "-0.5px" }}
            >
                {valor.toLocaleString("es-CL")}
            </Typography>
            {texto && (
                <Typography sx={{
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    opacity: 0.8,
                    mt: 0.25,
                    lineHeight: 1.2,
                }}>
                    {texto}
                </Typography>
            )}
            <Box sx={{
                mt: texto ? 0.75 : 0.5,
                mx: "auto",
                width: "40%",
                height: "1px",
                background: "rgba(255,255,255,0.3)",
                borderRadius: 1,
            }} />
            <Typography sx={{
                fontSize: "0.6rem",
                fontWeight: 700,
                opacity: 0.65,
                mt: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.9px",
                lineHeight: 1.2,
            }}>
                {subtexto}
            </Typography>
        </Box>
    );
};

const Dashboard = () => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery("(max-width:360px)");     // iPhone SE / muy compacto
    const isLargeMobile = useMediaQuery("(min-width:400px) and (max-width:480px)"); // iPhone 14 Pro Max
    const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // ≤600px en general
    const cardSize = isSmallMobile ? "180px" : isLargeMobile ? "280px" : isMobile ? "245px" : "340px";
    const smallCardSize = isSmallMobile ? "82px" : isLargeMobile ? "132px" : isMobile ? "116px" : "165px";


    const [mostrarContadorPrincipal, setMostrarContadorPrincipal] = useState(false);
    const [mostrarContadorChile, setMostrarContadorChile] = useState(false);
    const [mostrarContadorInt, setMostrarContadorInt] = useState(false);
    const [snackbarServicios, setSnackbarServicios] = useState({
        open: false,
        message: "",
        severity: "info",
    });
    const location = useLocation();
    const [usuario, setUsuario] = useState(null);
    const [visitasTotales, setVisitasTotales] = useState(0);
    const [visitasChile, setVisitasChile] = useState(0);
    const [visitasInternacional, setVisitasInternacional] = useState(0);

    const letterVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { delay: 0.4 + i * 0.05 }, // puedes ajustar el delay aquí
        }),
    };
    const [flip, setFlip] = useState(false);
    const [dispositivos, setDispositivos] = useState({ mobile: 0, desktop: 0, tablet: 0 });
    const [mostrarGrafico, setMostrarGrafico] = useState(false);
    const [mostrarPorcentajes, setMostrarPorcentajes] = useState(false);
    const [chartKey, setChartKey] = useState(0);
    const [datosGrafico, setDatosGrafico] = useState([]);
    const navigate = useNavigate();
    const [openPase, setOpenPase] = useState(false);
    const [analyticsDisponible, setAnalyticsDisponible] = useState(true);
    const [conCupos, setConCupos] = useState(() => localStorage.getItem("ConCupos") === "true");
    const [guardandoConCupos, setGuardandoConCupos] = useState(false);

    //GOOGLE ANALYTICS
    useEffect(() => {
        const obtenerVisitas = async () => {
            try {
                const endpoint =
                    window.location.hostname === "localhost"
                        ? "http://localhost:8888/.netlify/functions/getAnalyticsStats"
                        : "/.netlify/functions/getAnalyticsStats";

                const res = await fetch(endpoint);

                if (!res.ok) {
                    // 🚨 Si el backend devolvió 404 o 500
                    setAnalyticsDisponible(false);
                    return;
                }

                const data = await res.json();

                setVisitasChile(data.chile?.total || 0);
                setVisitasInternacional(data.internacional?.total || 0);
                setVisitasTotales(data.total || 0);

                setDispositivos({
                    mobile: (data.chile?.mobile || 0) + (data.internacional?.mobile || 0),
                    desktop: (data.chile?.desktop || 0) + (data.internacional?.desktop || 0),
                    tablet: (data.chile?.tablet || 0) + (data.internacional?.tablet || 0),
                });


                setMostrarContadorPrincipal(true);
                setAnalyticsDisponible(true);
            } catch (err) {
                console.error("Error cargando visitas:", err);
                setAnalyticsDisponible(false);
            }
        };

        obtenerVisitas();
    }, []);

    //CONTRATAR GOOGLE ANALYTICS
    const handleContactClick = (title) => {
        const mensaje = `¡Hola! Me interesa contratar ${encodeURIComponent(title)} ¿Me comentas?`;
        window.open(`https://api.whatsapp.com/send?phone=56946873014&text=${mensaje}`, "_blank");
    };

    //GUARDAR USUARIO EN SESIÓN
    useEffect(() => {
        const usuarioGuardado = JSON.parse(sessionStorage.getItem("usuario"));
        if (usuarioGuardado) {
            setUsuario(usuarioGuardado);
        }
    }, []);

    useEffect(() => {
        const syncConCupos = () => {
            setConCupos(localStorage.getItem("ConCupos") === "true");
        };

        window.addEventListener("storage", syncConCupos);
        window.addEventListener("conCuposChanged", syncConCupos);

        return () => {
            window.removeEventListener("storage", syncConCupos);
            window.removeEventListener("conCuposChanged", syncConCupos);
        };
    }, []);

    //PASE MENSUAL
    useEffect(() => {
        const timer = setTimeout(() => {
            setOpenPase(true);
        }, 1500); // ⏱️ 1 segundo después de cargar
        return () => clearTimeout(timer);
    }, []);

    //AJUSTAR COMPONENTE
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.body.style.zoom = "100%";
        return () => {
            document.body.style.zoom = "100%";
        };
    }, []);

    const handleChangeConCupos = async (event) => {
        const nextValue = event.target.checked;
        const previousValue = conCupos;

        setConCupos(nextValue);
        setGuardandoConCupos(true);

        try {
            const isLocal = window.location.hostname === "localhost";
            const endpoint = isLocal
                ? "http://localhost:8888/.netlify/functions/actualizarSeguridad"
                : "/.netlify/functions/actualizarSeguridad";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: 1,
                    valor: nextValue ? 1 : 0,
                }),
            });

            if (!response.ok) {
                throw new Error("No se pudo actualizar Seguridad.xlsx");
            }

            localStorage.setItem("ConCupos", String(nextValue));
            window.dispatchEvent(new Event("conCuposChanged"));
            setSnackbarServicios({
                open: true,
                message: nextValue
                    ? "✅ Se activaron los cupos de Plataformas Web."
                    : "🚫 Se desactivaron los cupos de Plataformas Web.",
                severity: "success",
            });
        } catch (error) {
            console.error("Error actualizando ConCupos:", error);
            setConCupos(previousValue);
            setSnackbarServicios({
                open: true,
                message: "⚠️ No se pudo actualizar el estado de los cupos.",
                severity: "error",
            });
        } finally {
            setGuardandoConCupos(false);
        }
    };


    return (
        <Box
            sx={{
                height: isMobile ? "100dvh" : "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                overflow: "hidden",
            }}
        >
            {/* Mitad superior: video de fondo */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    zIndex: 0,
                    overflow: "hidden",
                }}
            >
                <Box
                    component="video"
                    src="/video-inicio-oficial.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.9,
                    }}
                />
                {/* Overlay suave para legibilidad */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
                    }}
                />
            </Box>

            {/* Mitad inferior: fondo actual */}
            <Box
                sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "50%",
                    backgroundImage: "url(/fondo-blizz.avif)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    zIndex: 0,
                }}
            />

            <Grid item sx={{ pt: isMobile ? 11 : 11 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 1,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Box
                        sx={{
                            px: 2,
                            py: 0.45,
                            minWidth: isMobile ? "170px" : "190px",
                            borderRadius: "999px",
                            background: "rgba(5, 15, 30, 0.58)",
                            border: "1px solid rgba(255,255,255,0.16)",
                            backdropFilter: "blur(8px)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={conCupos}
                                    onChange={handleChangeConCupos}
                                    disabled={guardandoConCupos}
                                    size="small"
                                    sx={{
                                        "& .MuiSwitch-switchBase": {
                                            color: "#ef5350",
                                        },
                                        "& .MuiSwitch-track": {
                                            backgroundColor: "#c62828",
                                            opacity: 1,
                                        },
                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                            color: "#4fc3f7",
                                        },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            backgroundColor: "#29b6f6",
                                            opacity: 1,
                                        },
                                    }}
                                />
                            }
                            label={guardandoConCupos ? "Actualizando.." : "Con Cupos"}
                            sx={{
                                m: 0,
                                width: "100%",
                                color: "white",
                                justifyContent: "space-between",
                                "& .MuiFormControlLabel-label": {
                                    color: "#ffffff",
                                    fontSize: isMobile ? "0.82rem" : "0.9rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.02em",
                                    whiteSpace: "nowrap",
                                },
                                "& .MuiFormControlLabel-label.Mui-disabled": {
                                    color: "#ffffff",
                                    opacity: 1,
                                },
                            }}
                        />
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        gap: 1,
                        mb: 1,
                        flexWrap: "wrap",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                            display: "inline-flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            fontSize: isMobile ? "0.95rem" : "1.05rem",
                        }}
                    >
                        {"Bienvenido ".split("").map((char, index) => (
                            <motion.span
                                key={`char-${index}`}
                                custom={index}
                                variants={letterVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ display: "inline-block" }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}

                        {/* Si hay usuario, mostramos su nombre animado */}
                        {usuario && (usuario.alias || usuario.nombre || usuario.usuario)?.split("").map((char, index) => (
                            <motion.span
                                key={`nombre-${index}`}
                                custom={index + 10}
                                variants={letterVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ display: "inline-block" }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </Typography>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                    >
                        {usuario?.usuario === "iaguilera" ? (
                            <Typography sx={{ fontSize: 26 }}>😎</Typography>
                        ) : (
                            <AdminPanelSettingsIcon sx={{ fontSize: 26, color: "white" }} />
                        )}
                    </motion.div>
                </Box>
            </Grid>

            <Grid
                container
                spacing={1.5}
                justifyContent="top"
                alignItems="center"
                direction="column"
                sx={{ width: "100%", flexGrow: 1, position: "relative", zIndex: 1 }}
            >
                {/* Cuadro principal con animación */}
                <Grid item>
                    <Box sx={{ perspective: 1000, width: cardSize, height: cardSize }}
                        onClick={() => {
                            if (!analyticsDisponible) return; // 🚫 no girar si no hay GA

                            if (!flip) {
                                setFlip(true);
                                setMostrarGrafico(false);
                                setMostrarPorcentajes(false);
                                setDatosGrafico([]);

                                setTimeout(() => {
                                    setMostrarGrafico(true);
                                    setDatosGrafico([
                                        { name: "Móvil", value: dispositivos.mobile },
                                        { name: "Escritorio", value: dispositivos.desktop },
                                        { name: "Tablet", value: dispositivos.tablet },
                                    ]);
                                }, 100);

                                setTimeout(() => {
                                    setMostrarPorcentajes(true);
                                }, 1000);
                            } else {
                                setFlip(false);
                            }
                        }}
                    >

                        <Box
                            component={motion.div}
                            animate={{ rotateY: flip ? 180 : 0 }}
                            transition={{ duration: 0.6 }}
                            sx={{
                                width: "100%",
                                height: "100%",
                                transformStyle: "preserve-3d",
                                position: "relative",
                            }}
                        >
                            {/* Cara frontal */}
                            <Box
                                sx={{
                                    backfaceVisibility: "hidden",
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <Paper
                                    elevation={6}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        background: analyticsDisponible
                                            ? "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(200,200,200,0.05))" // elegante translúcido con brillo sutil
                                            : "linear-gradient(145deg, #FFD700, #FFA500)", // no contratado = dorado
                                        color: analyticsDisponible ? "white" : "black",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 4,
                                        textAlign: "center",
                                        cursor: "pointer",
                                        border: analyticsDisponible ? "2px solid white" : "3px solid #FFD700", // borde blanco sólido si está contratado
                                        boxShadow: analyticsDisponible
                                            ? "0 0 18px rgba(255,255,255,0.25)" // glow blanco elegante
                                            : "0 0 15px rgba(255, 215, 0, 0.7)", // glow dorado
                                        backdropFilter: "blur(6px)", // efecto glass
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        "&:hover": {
                                            transform: "scale(1.05)",
                                            boxShadow: analyticsDisponible
                                                ? "0 0 28px rgba(255,255,255,0.5)" // más brillo en hover
                                                : "0 0 25px rgba(255, 215, 0, 1)",
                                        },
                                        p: 2,
                                    }}
                                    onClick={() => {
                                        if (!analyticsDisponible) {
                                            handleContactClick("Google Analytics por $10.000 CLP");
                                        }
                                    }}
                                >
                                    {analyticsDisponible ? (
                                        <Contador
                                            valorFinal={visitasTotales || 0}
                                            texto="visitas"
                                            subtexto="Visitas totales"
                                            variant="h4"
                                            iniciar={mostrarContadorPrincipal}
                                        />
                                    ) : (
                                        <>
                                            <Box
                                                component="img"
                                                src="/logo-google-analytics.png"
                                                alt="Google Analytics"
                                                sx={{
                                                    width: 200,
                                                    mb: 1,
                                                    filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))",
                                                }}
                                            />
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                sx={{
                                                    color: "white",
                                                    textShadow: "0px 0px 4px #FFD700, 0px 0px 8px #FFA500",
                                                    mb: 1,
                                                }}
                                            >
                                                Contrata Google Analytics
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                                sx={{
                                                    color: "white",
                                                    border: "2px solid white",
                                                    borderRadius: "12px",
                                                    px: 2,
                                                    py: 0.5,
                                                    textAlign: "center",
                                                    boxShadow: "0 0 8px rgba(255, 255, 255, 0.7)",
                                                    background: "rgba(255, 255, 255, 0.15)",
                                                }}
                                            >
                                                $10.000 CLP
                                            </Typography>
                                        </>
                                    )}
                                </Paper>



                            </Box>

                            {/* Cara trasera */}
                            <Box
                                sx={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                <Paper
                                    elevation={4}
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                                        backdropFilter: "blur(4px)",
                                        color: "white",
                                        borderRadius: 3,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        p: isMobile ? 0.5 : 2,
                                    }}
                                >
                                    {mostrarGrafico && (
                                        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
                                            <PieChart>
                                                <Pie
                                                    data={datosGrafico}
                                                    cx="50%"
                                                    cy={isMobile ? "43%" : "48%"}
                                                    outerRadius={isSmallMobile ? 62 : isLargeMobile ? 88 : isMobile ? 90 : 110}
                                                    dataKey="value"
                                                    isAnimationActive={true}
                                                    animationBegin={0}
                                                    animationDuration={800}
                                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                        if (percent === 0 || !mostrarPorcentajes) return null;
                                                        const RADIAN = Math.PI / 180;
                                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                        return (
                                                            <motion.text
                                                                x={x}
                                                                y={y}
                                                                initial={{ opacity: 0, scale: 0.5 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ duration: 0.5 }}
                                                                fill="white"
                                                                textAnchor="middle"
                                                                dominantBaseline="central"
                                                                fontSize={isMobile ? 13 : 18}
                                                                fontWeight="bold"
                                                            >
                                                                {(percent * 100).toFixed(0)}%
                                                            </motion.text>
                                                        );
                                                    }}
                                                    labelLine={false}
                                                >
                                                    <Cell fill="#6EB5FF" />
                                                    <Cell fill="#B0F0A5" />
                                                    <Cell fill="#FFB3B3" />
                                                </Pie>
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={isMobile ? 30 : 50}
                                                    iconSize={isMobile ? 8 : 12}
                                                    wrapperStyle={{
                                                        fontSize: isMobile ? "0.68rem" : "0.875rem",
                                                        paddingTop: isMobile ? 2 : 10,
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}

                                </Paper>
                            </Box>
                        </Box>
                    </Box>
                </Grid>


                {/* Dos cuadros pequeños */}
                <Grid item sx={{ mt: 0.5 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        {/* Paper pequeño 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -80 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            onAnimationComplete={() => setMostrarContadorChile(true)}
                        >
                            <Paper
                                elevation={3}
                                sx={{
                                    width: smallCardSize,
                                    height: smallCardSize,
                                    background: analyticsDisponible
                                        ? "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(200,200,200,0.05))"
                                        : "linear-gradient(145deg, #E6C200, #C49000)", // dorado más tenue
                                    color: analyticsDisponible ? "white" : "black",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: 3,
                                    textAlign: "center",
                                    border: analyticsDisponible ? "2px solid white" : "2px solid #E6C200",
                                    boxShadow: analyticsDisponible
                                        ? "0 0 12px rgba(255,255,255,0.25)"
                                        : "0 0 10px rgba(230, 194, 0, 0.5)",
                                    backdropFilter: "blur(6px)",
                                    p: 0.5,
                                }}
                            >
                                {analyticsDisponible ? (
                                    <Contador
                                        valorFinal={visitasChile || 0}
                                        texto="visitas"
                                        subtexto="Chile 🇨🇱"
                                        delay={100}
                                        iniciar={mostrarContadorChile}
                                    />
                                ) : (
                                    <>
                                        <Typography variant="h4" component="div" sx={{ mb: 0.5 }}>
                                            🖥️
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            fontSize={isMobile ? "0.8rem" : "1rem"}
                                            fontWeight="bold"
                                            sx={{ textAlign: "center" }}
                                        >
                                            Monitorea visitas de tu sitio web
                                        </Typography>
                                    </>
                                )}
                            </Paper>
                        </motion.div>

                        {/* Paper pequeño 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 80 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            onAnimationComplete={() => setMostrarContadorInt(true)}
                        >
                            <Paper
                                elevation={3}
                                sx={{
                                    width: smallCardSize,
                                    height: smallCardSize,
                                    background: analyticsDisponible
                                        ? "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(200,200,200,0.05))"
                                        : "linear-gradient(145deg, #E6C200, #C49000)", // dorado más tenue
                                    color: analyticsDisponible ? "white" : "black",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: 3,
                                    textAlign: "center",
                                    border: analyticsDisponible ? "2px solid white" : "2px solid #E6C200",
                                    boxShadow: analyticsDisponible
                                        ? "0 0 12px rgba(255,255,255,0.25)"
                                        : "0 0 10px rgba(230, 194, 0, 0.5)",
                                    backdropFilter: "blur(6px)",
                                    p: 0.5,
                                }}
                            >
                                {analyticsDisponible ? (
                                    <Contador
                                        valorFinal={visitasInternacional || 0}
                                        texto="visitas"
                                        subtexto="Internacional 🌍"
                                        delay={100}
                                        iniciar={mostrarContadorInt}
                                    />
                                ) : (
                                    <>
                                        <Typography variant="h4" component="div" sx={{ mb: 0.5 }}>
                                            📊
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            fontSize={isMobile ? "0.8rem" : "1rem"}
                                            fontWeight="bold"
                                            sx={{ textAlign: "center" }}
                                        >
                                            Analiza interacción de tus clientes
                                        </Typography>
                                    </>
                                )}
                            </Paper>
                        </motion.div>
                    </Box>


                    <Box sx={{ height: isMobile ? 100 : 110 }} />
                </Grid>


                <MenuInferior cardSize={cardSize} modo="dashboard" />



            </Grid >
            <Snackbar
                open={snackbarServicios.open}
                autoHideDuration={2000}
                onClose={() => setSnackbarServicios((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity={snackbarServicios.severity} icon={false}
                    onClose={() => setSnackbarServicios((prev) => ({ ...prev, open: false }))}
                    sx={{
                        width: "100%",
                        fontSize: isMobile ? "0.74rem" : "0.9rem",
                        boxShadow: 3,
                        whiteSpace: "nowrap",
                    }}
                >
                    {snackbarServicios.message}
                </Alert>
            </Snackbar>
            {/*<DialogPaseMensual
                open={openPase}
                onClose={() => setOpenPase(false)}
                analyticsDisponible={analyticsDisponible}
            />*/}

        </Box >

    );
};

export default Dashboard;
