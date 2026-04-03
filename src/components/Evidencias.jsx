import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, useTheme, useMediaQuery, Snackbar, Alert, Dialog, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useInView } from "react-intersection-observer";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const Evidencias = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef();
    const videosRef = useRef([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [mobileBatchIndex, setMobileBatchIndex] = useState(0);
    const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(null);
    const [scrollY, setScrollY] = useState(0);
    const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true, rootMargin: '0px 0px -30% 0px' });
    const [hasAnimated, setHasAnimated] = useState(false);
    const { ref: imagenRef, inView: imagenInView } = useInView({ threshold: 0.3, triggerOnce: true });
    const { ref: muchosMasRef, inView: muchosMasInView } = useInView({ threshold: 0.2, triggerOnce: true });

    const evidencias = [
        {
            url: "https://www.ivelpink.cl",
            label: "www.ivelpink.cl",
            video: "/evidencia1.mp4",
            logo: "/logos/logo-ivelpink.jpg"
        },
        {
            url: "https://www.ingsnt.cl",
            label: "www.ingsnt.cl",
            video: "/evidencia2.mp4",
            logo: "/logos/logo-ingsnt.png"
        },
        {
            url: "https://www.masatracker.cl",
            label: "www.masatracker.cl",
            video: "/evidencia3.mp4",
            logo: "/logos/logo-mastracker.png"
        },
        {
            url: "https://www.investigadores-privados.cl",
            label: "investigadores-privados.cl",
            video: "/evidencia4.mp4",
            logo: "/logos/logo-investigadores-privados.png"
        },
        {
            url: "https://www.masautomatizacion.cl",
            label: "masautomatizacion.cl",
            video: "/evidencia5.mp4",
            logo: "/logos/logo-masautomatizacion.png"
        },
        {
            url: "https://www.sifg.cl",
            label: "www.sifg.cl",
            video: "/evidencia6.mp4",
            logo: "/logos/logo-sifg.png"
        },
        {
            url: null,
            label: "www.autoges-web.cl",
            video: "/evidencia7.mp4",
            logo: "/logos/logo-autoges.png"
        }, // tachada
    ];

    const evidenciaIndices = isMobile
        ? [[0, 1], [2, 3], [4, 5], [6]]   // Mobile â†’ 3 filas de 2 + 1 fila de 1
        : [[0], [1], [2], [3], [4], [5], [6]]; // Desktop â†’ todas en filas individuales


    const letterVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: { delay: 0.4 + i * 0.04 }, // puedes ajustar el tiempo
        }),
    };
    const textoAnimado = "Trabajos recientes";
    const handleSnackbarClose = (_, reason) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };
    useEffect(() => {
        if (!isMobile || !inView || selectedEvidenceIndex !== null) return;

        const totalBatches = evidenciaIndices.length;
        const interval = setInterval(() => {
            setMobileBatchIndex((prev) => (prev + 1) % totalBatches);
        }, 2500);

        return () => clearInterval(interval);
    }, [isMobile, inView, selectedEvidenceIndex, evidenciaIndices.length]);

    useEffect(() => {
        if (!isMobile) return;
        setMobileBatchIndex(0);
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) return;
        if (!inView || selectedEvidenceIndex !== null) return;

        const interval = setInterval(() => {
            setActiveVideoIndex((prev) => (prev + 1) % evidencias.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [inView, evidencias.length, selectedEvidenceIndex, isMobile]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setVisible(true);
            },
            { threshold: 0.1 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const handleFullscreen = (video) => {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    };

    useEffect(() => {
        if (isMobile) {
            const handleScroll = () => setScrollY(window.scrollY);
            window.addEventListener("scroll", handleScroll);
            return () => window.removeEventListener("scroll", handleScroll);
        }
    }, [isMobile]);

    const videoRef = useRef(null);

    useEffect(() => {
        if (imagenInView && videoRef.current) {
            videoRef.current.play().catch(err => {
                console.warn('Error al reproducir video:', err);
            });
        }
    }, [imagenInView]);

    useEffect(() => {
        videosRef.current.forEach((video, index) => {
            if (!video) return;

            const mobileActiveIndexes = evidenciaIndices[mobileBatchIndex] || [];

            const shouldPlay = isMobile
                ? inView && selectedEvidenceIndex === null && mobileActiveIndexes.includes(index)
                : inView && selectedEvidenceIndex === null && index === activeVideoIndex;

            if (shouldPlay) {
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        });
    }, [activeVideoIndex, inView, selectedEvidenceIndex, isMobile, mobileBatchIndex, evidenciaIndices]);

    return (
        <Box sx={{ width: '100%', position: 'relative', mt: '-80px' }}>
            {/* SecciÃ³n 1 */}
            <Box
                sx={{
                    position: 'relative',
                    height: isMobile ? '60vh' : '40vh',
                    pt: { xs: 8, sm: 10 },
                    backgroundImage: `url('fondo-telefono.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 1,
                }}
            >

                {/* Box para el degradado */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2%',
                        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent)',
                    }}
                />

                {/* Contenedor con el texto en movimiento */}
                <Box
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        position: 'absolute',
                        top: '30px',
                        left: 0,
                        right: 0,
                        zIndex: 5, // mas alto que la mano (3)
                    }}
                >
                    <motion.div
                        initial={{ x: '100vw' }}
                        animate={{ x: '-100%' }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                        style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' },
                                fontWeight: 600,
                                color: 'white',
                                fontFamily: `'Montserrat', 'Segoe UI', sans-serif`,
                                textShadow: '1px 1px 4px rgba(0,0,0,0.2)',
                                px: 4,
                            }}
                        >
                            Control total sobre tu{' '}
                            <span style={{ color: '#ffe037' }}>negocio.</span>
                        </Typography>
                    </motion.div>
                </Box>


                {/* Imagen + video */}
                <Box
                    ref={imagenRef}
                    sx={{
                        position: 'absolute', // ðŸš€ clave!
                        bottom: '5%', // ðŸš€ hace que sobresalga un 10% en SecciÃ³n 2
                        left: '27%',
                        transform: 'translateX(0%)',
                        width: '100%',
                        maxWidth: '250px',
                        aspectRatio: '572 / 788',
                        zIndex: 3,
                        pointerEvents: 'none', // para que no bloquee clics
                    }}
                >
                    {/* Video detrÃ¡s */}
                    <motion.video
                        ref={videoRef}
                        src="/video-administracion.mp4"
                        loop
                        muted
                        playsInline
                        preload="auto"
                        initial={{ x: 300, opacity: 0 }}
                        animate={imagenInView ? { x: '0%', opacity: 1 } : { x: 300, opacity: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: '5%',
                            left: '12%',
                            width: '54.4%',
                            height: '81.7%',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            zIndex: 0,
                            backgroundColor: 'black',
                        }}
                    />

                    {/* Imagen PNG encima */}
                    <motion.img
                        src="/mano-celular.webp"
                        alt="Decorativo"
                        initial={{ x: 300, opacity: 0 }}
                        animate={imagenInView ? { x: '0%', opacity: 1 } : { x: 300, opacity: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                            width: '100%',
                            height: 'auto',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 1,
                            pointerEvents: 'none',
                        }}
                    />
                </Box>
            </Box>





            {/* SecciÃ³n 2 */}
            <Box
                sx={{
                    position: 'relative',
                    backgroundImage: `url('/fondo-blizz-2.webp')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    pt: isMobile ? 0 : 0,
                    pb: 4,
                    px: { xs: 2, sm: 4 },
                    zIndex: 2,
                    mt: 0,
                    boxShadow: '0px -4px 20px rgba(0,0,0,0.05)',
                    borderTop: '1px solid #e0e0e0',
                }}
            >
                {/* Clip decorativo */}
                <Box
                    ref={ref}
                    sx={{
                        position: 'absolute',
                        top: isMobile ? '-9vh' : '-99px',
                        left: 0,
                        width: '100%',
                        height: 100,
                        zIndex: 1,
                        clipPath: isMobile
                            ? "polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)"
                            : "polygon(0 0, 50% 70%, 100% 0, 100% 100%, 0 100%)",
                        backgroundImage: `url('/fondo-blizz-2.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        pointerEvents: 'none',
                    }}
                />

                {/* Logos y videos */}
                <motion.div
                    ref={sectionRef}
                    initial={{ opacity: 0, y: 50 }}
                    animate={visible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1 }}
                    style={{ position: 'relative', zIndex: 6 }}
                >
                    <Box sx={{ position: 'relative' }}>
                        <Box
                            sx={{
                                zIndex: 3,
                                background: "#241a1a",
                                borderRadius: 4,
                                p: { xs: 2, sm: 4 },
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                                maxWidth: "1200px",
                                mx: "auto",
                            }}
                        >
                            <Typography
                                variant="h4"
                                gutterBottom
                                component="div"
                                sx={{
                                    fontFamily: '"Poppins", sans-serif',
                                    fontSize: { xs: "1.5rem", md: "2rem" },
                                    paddingX: { xs: "10px", md: "30px" }, // mejor usar paddingX para izquierda y derecha
                                    paddingY: { xs: "10px", md: "20px" }, // tambien puedes darle arriba/abajo si quieres mas aire
                                    letterSpacing: "3px",
                                    my: 0,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center", // ðŸ‘ˆ ahora el contenido dentro queda al centro
                                    alignItems: "center",
                                    backgroundColor: "transparent",
                                    color: "lightgray",
                                    textAlign: "center", // ðŸ‘ˆ adicional para asegurar texto centrado
                                }}
                            >
                                {/* Barra | cafÃ© al inicio */}
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={inView || hasAnimated ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        color: "#8B4513",
                                        fontWeight: "bold",
                                        marginRight: "2px",
                                        marginTop: "-1px",
                                        fontSize: "0.9em",
                                        lineHeight: 1,
                                        display: "inline-block",
                                        transform: "translateY(2px)",
                                    }}
                                >
                                    |
                                </motion.span>

                                {/* Texto animado letra por letra */}
                                {textoAnimado.split("").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        custom={i}
                                        variants={letterVariants}
                                        initial="hidden"
                                        animate={inView || hasAnimated ? "visible" : "hidden"}
                                        style={{
                                            display: "inline-block",
                                            whiteSpace: "pre",
                                        }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </Typography>

                            <Grid container spacing={3} justifyContent="center" mt={0.3}>
                                {evidenciaIndices.map((group, groupIdx) => (
                                    <Grid container item spacing={3} xs={12} key={`group-${groupIdx}`} justifyContent="center">
                                        {group.map((n, i) => (
                                            <Grid
                                                item
                                                xs={group.length === 2 ? 6 : 12}
                                                sm={6}
                                                md={4}
                                                key={n}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, y: 30 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: (groupIdx * 2 + i) * 0.2 }}
                                                >
                                                    <Card
                                                        sx={{
                                                            bgcolor: '#ffffff',
                                                            borderRadius: 4,
                                                            overflow: 'hidden',
                                                            position: 'relative',
                                                            '&::after': {
                                                                content: '""',
                                                                position: 'absolute',
                                                                bottom: -20,
                                                                left: '10%',
                                                                width: '80%',
                                                                height: '30px',
                                                                background: 'rgba(0, 0, 0, 0.45)',
                                                                filter: 'blur(12px)',
                                                                borderRadius: '50%',
                                                                zIndex: 0,
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: '100%',
                                                                height: 250,
                                                                backgroundColor: '#000',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                                                                <CardMedia
                                                                    component="video"
                                                                    ref={(el) => (videosRef.current[n] = el)}
                                                                    src={evidencias[n].video}
                                                                    playsInline
                                                                    muted
                                                                    loop
                                                                    preload="metadata"
                                                                    controls={false}
                                                                    disablePictureInPicture
                                                                    controlsList="nodownload nofullscreen noremoteplayback"
                                                                    onClick={() => {
                                                                        setActiveVideoIndex(n);
                                                                        setSelectedEvidenceIndex(n);
                                                                    }}
                                                                    sx={{
                                                                        height: "100%",
                                                                        width: "100%",
                                                                        objectFit: "cover",
                                                                        cursor: "pointer",
                                                                        zIndex: 1,
                                                                    }}
                                                                />

                                                                {evidencias[n].logo && (
                                                                    <Box
                                                                        sx={{
                                                                            position: "absolute",
                                                                            bottom: 4,
                                                                            left: "50%",
                                                                            transform: "translateX(-50%)", // âœ… solo centra
                                                                            zIndex: 2,
                                                                        }}
                                                                    >
                                                                        {/* Este es el que anima scale/opacity */}
                                                                        <Box
                                                                            component={motion.div}
                                                                            initial={{ scale: 0, opacity: 0 }}
                                                                            animate={inView ? { scale: 1, opacity: 1 } : {}}
                                                                            transition={{
                                                                                duration: 0.6,
                                                                                ease: "easeOut",
                                                                                delay: 1   // delay de 1 segundo
                                                                            }}
                                                                            sx={{
                                                                                width: 70,
                                                                                height: 70,
                                                                                borderRadius: "50%",
                                                                                background:
                                                                                    "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                                                                p: "4px",
                                                                            }}
                                                                        >
                                                                            <Box
                                                                                component="img"
                                                                                src={evidencias[n].logo}
                                                                                alt={`${evidencias[n].label} logo`}
                                                                                sx={{
                                                                                    width: "100%",
                                                                                    height: "100%",
                                                                                    borderRadius: "50%",
                                                                                    backgroundColor: "#fff",
                                                                                    objectFit: "contain",
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    </Box>
                                                                )}



                                                            </Box>

                                                        </Box>

                                                        {evidencias[n].url ? (
                                                            <Typography
                                                                variant="body2"
                                                                align="center"
                                                                component="a"
                                                                href={evidencias[n].url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"

                                                                sx={{
                                                                    fontSize: evidencias[n].label === "investigadores-privados.cl" ? "0.63rem" : "0.75rem", // ðŸ‘ˆ solo cambia aquÃ­

                                                                    display: 'block',
                                                                    mt: 1.5,
                                                                    mb: 1.5,
                                                                    color: '#00bcd4',
                                                                    fontFamily: 'Poppins, sans-serif',
                                                                    textDecoration: 'none',
                                                                    textAlign: 'center',
                                                                    '&:hover': {
                                                                        textDecoration: 'underline',
                                                                        color: '#26c6da',
                                                                    },
                                                                }}
                                                            >
                                                                {evidencias[n].label}
                                                            </Typography>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                align="center"
                                                                sx={{
                                                                    display: 'block',
                                                                    mt: 1.5,
                                                                    mb: 1.5,
                                                                    color: '#00bcd4',
                                                                    fontFamily: 'Poppins, sans-serif',
                                                                    textAlign: 'center',
                                                                    //textDecoration: 'line-through',
                                                                    cursor: 'not-allowed',
                                                                    pointerEvents: 'none',
                                                                }}
                                                            >
                                                                {evidencias[n].label}
                                                            </Typography>
                                                        )}

                                                    </Card>
                                                </motion.div>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ))}
                                {/* Texto final */}
                                <Grid item xs={12}>
                                    <Typography
                                        ref={muchosMasRef} // ðŸ‘ˆ le pasamos el observer
                                        variant="body1"
                                        align="center"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontStyle: 'italic',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontFamily: 'Poppins, sans-serif',
                                            fontSize: '1.2rem',
                                            mt: 0,
                                            letterSpacing: 1,
                                            textShadow: '0 1px 8px #b2ebf2',
                                        }}
                                    >
                                        {"y muchos más...".split("").map((char, i) => (
                                            <motion.span
                                                key={i}
                                                custom={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={muchosMasInView ? { opacity: 1, y: 0 } : {}} // ðŸ‘ˆ ahora depende solo de este ref
                                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                                style={{
                                                    display: "inline-block",
                                                    whiteSpace: "pre",
                                                }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                    </Typography>

                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </motion.div >
            </Box >

            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}            >
                <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
                    Para ver más trabajos contáctanos vía redes sociales.
                </Alert>
            </Snackbar>

            <Dialog
                open={selectedEvidenceIndex !== null}
                onClose={() => setSelectedEvidenceIndex(null)}
                maxWidth={false}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        backdropFilter: "blur(6px)",
                    },
                }}
                PaperProps={{
                    sx: {
                        width: { xs: "88vw", sm: "360px", md: "390px" },
                        maxWidth: "88vw",
                        background: "transparent",
                        borderRadius: "24px",
                        boxShadow: "none",
                        overflow: "visible",
                        transform: "translateY(-16px)",
                    },
                }}
            >
                {selectedEvidenceIndex !== null && (
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            p: { xs: 0.5, sm: 0.7 },
                            boxSizing: "border-box",
                        }}
                    >
                        <Box
                            sx={{
                                width: "100%",
                                borderRadius: "20px",
                                overflow: "hidden",
                                backgroundColor: "rgba(7,16,27,0.96)",
                                border: "2px solid rgba(255,255,255,0.9)",
                                position: "relative",
                                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                            }}
                        >
                            <IconButton
                                aria-label="Cerrar video"
                                onClick={() => setSelectedEvidenceIndex(null)}
                                sx={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    zIndex: 2,
                                    color: "#fff",
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    "&:hover": {
                                        backgroundColor: "rgba(0,0,0,0.68)",
                                    },
                                }}
                            >
                                <CloseRoundedIcon />
                            </IconButton>

                            <Box
                                component="video"
                                src={evidencias[selectedEvidenceIndex].video}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="auto"
                                controls={false}
                                sx={{
                                    width: "100%",
                                    maxHeight: { xs: "68vh", sm: "74vh" },
                                    display: "block",
                                    backgroundColor: "#000",
                                    objectFit: "contain",
                                }}
                            />
                        </Box>

                        <motion.div
                            key={evidencias[selectedEvidenceIndex].label}
                            initial={{ y: 24 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.28, ease: "easeOut", delay: 0.06 }}
                            style={{ width: "100%" }}
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    borderRadius: "18px",
                                    border: "2px solid rgba(129, 212, 250, 0.9)",
                                    background: "linear-gradient(180deg, rgba(24, 168, 255, 0.99), rgba(0, 108, 204, 1))",
                                    boxShadow: "0 18px 38px rgba(0, 123, 255, 0.24)",
                                    px: 1.2,
                                    py: 1.25,
                                    boxSizing: "border-box",
                                }}
                            >
                                <Typography
                                    sx={{
                                        textAlign: "center",
                                        color: "#ffffff",
                                        fontSize: { xs: "0.92rem", sm: "1rem" },
                                        lineHeight: 1.4,
                                        fontWeight: 900,
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {evidencias[selectedEvidenceIndex].label}
                                </Typography>
                            </Box>
                        </motion.div>
                    </Box>
                )}
            </Dialog>

        </Box >
    );
};

export default Evidencias;




