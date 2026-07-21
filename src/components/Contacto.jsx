import React, { useState, useEffect, useRef } from "react";
import { Container, Typography, Box, Snackbar, Alert, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import "./css/Contacto.css"; // Importamos el CSS
import "leaflet/dist/leaflet.css"; // Estilo básico de Leaflet
import { MapContainer, TileLayer, Marker, useMapEvent } from "react-leaflet";
import L from "leaflet";
import ContactoForm from './ContactoForm';

// 📍 Coordenadas
const finalPosition = [-33.399871585904094, -70.74223163208484]; // sucursal 1
const otraSucursalPosition = [-33.43341720871407, -70.63634900664654];// sucursal 2
const otraSucursalPosition2 = [-33.56868063044323, -70.77689075499913]; // sucursal 3

const letterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.4 + i * 0.1 },
  }),
};


function Contacto() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [startAnimation, setStartAnimation] = useState(false);
  const [containerHeight, setContainerHeight] = useState("50vh"); // Inicia con 50vh
  const [rotate, setRotate] = useState(0);
  const finalZoom = 17; // Zoom final al que queremos llegar
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [activeSucursal, setActiveSucursal] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "error" });

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        setStartAnimation(true);
        setContainerHeight("auto");
      }, isMobile ? 0 : 1300);
      return () => clearTimeout(timer);
    }
  }, [inView, isMobile]);


  // Componente que maneja los clics en el mapa
  const MapClickHandler = () => {
    useMapEvent("click", () => {
      const googleMapsUrl = `https://www.google.com/maps?q=${finalPosition[0]},${finalPosition[1]}`;
      window.open(googleMapsUrl, "_blank"); // Abre Google Maps en una nueva pestaña
    });

    return null; // No renderiza nada, solo maneja el evento
  };


  // 📌 Iconos
  const iconSucursal1 = new L.Icon({
    iconUrl: "/logo-mapa.webp",
    iconSize: [160, 160],
    iconAnchor: [80, 80],
    popupAnchor: [0, -80],
  });

  const iconSucursal2 = new L.Icon({
    iconUrl: "/logo-mapa.webp",
    iconSize: [160, 160],
    iconAnchor: [80, 80],
    popupAnchor: [0, -80],
  });

  const iconSucursal3 = new L.Icon({
    iconUrl: "/logo-mapa.webp",
    iconSize: [160, 160],
    iconAnchor: [80, 80],
    popupAnchor: [0, -80],
  });

  // 📌 Array de sucursales
  const sucursales = [
    { coords: finalPosition, icon: iconSucursal1, text: "¡Visítanos aquí!" },
    { coords: otraSucursalPosition, icon: iconSucursal2, text: "Cotiza con nosotros!" },
    { coords: otraSucursalPosition2, icon: iconSucursal3, text: "¡Creamos tu Web!" },
  ];

  const FlyLoop = ({ sucursales, interval = 6000, firstDelay = 4500, zoom = 16, activeSucursal }) => {
    const map = useMapEvent("load", () => { });
    const idxRef = useRef(activeSucursal);

    useEffect(() => {
      if (!map || !sucursales?.length) return;

      idxRef.current = activeSucursal;

      let firstTimer;
      let loopTimer;

      const doFly = () => {
        const nextIdx = (idxRef.current + 1) % sucursales.length;
        const nextSucursal = sucursales[nextIdx];
        if (!nextSucursal) return;

        const target = nextSucursal.coords;

        setShowBanner(false);

        map.flyTo(target, zoom, {
          animate: true,
          duration: 2,
          easeLinearity: 0.25,
        });

        setTimeout(() => {
          idxRef.current = nextIdx;
          setActiveSucursal(nextIdx);
          setShowBanner(true);
        }, 2000);
      };

      // ⏱️ Primer vuelo más rápido
      firstTimer = setTimeout(() => {
        doFly();
        // ⏱️ Después, iniciar loop normal
        loopTimer = setInterval(doFly, interval);
      }, firstDelay);

      return () => {
        clearTimeout(firstTimer);
        clearInterval(loopTimer);
      };
    }, [map, sucursales, zoom, interval, firstDelay, activeSucursal]);

    return null;
  };



  return (
    <Container
      sx={{
        maxWidth: "none !important",
        marginLeft: 0,
        py: 11,
        position: "relative",
        overflow: "hidden",
        paddingTop: 0,
        paddingBottom: "20px",
        minHeight: "auto",
        backgroundImage: isMobile ? 'url(/fondo-mundo-mobile.png)' : 'url(/fondo-mundo.png)',
        backgroundColor: "rgb(0 30 43/var(--tw-bg-opacity,1))",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
      ref={ref}
    >
      {/* Paneles — solo desktop */}
      {!isMobile && <div className={`image image-left ${startAnimation ? "animate-left" : ""}`} style={{
        width: "50%", height: "100%",
        background: "linear-gradient(160deg, #000d1a 0%, #001f4d 50%, #003080 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,180,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{ position: "relative", textAlign: "center", padding: "0 32px", zIndex: 10 }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px", filter: "drop-shadow(0 0 20px rgba(0,220,255,0.9)) brightness(1.3)" }}>✉️</div>
          <div style={{ fontSize: "0.65rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: "#00e5ff", marginBottom: "10px", textShadow: "0 0 16px rgba(0,229,255,0.8)" }}>
            HABLEMOS
          </div>
          <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: "2rem", lineHeight: 1.15, marginBottom: "6px", color: "#ffffff", textShadow: "0 0 24px rgba(0,200,255,0.6), 0 2px 4px rgba(0,0,0,0.9)" }}>
            Contáctanos
          </div>
          <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, #00dcff, transparent)", margin: "0 auto 14px auto", borderRadius: "2px" }} />
          <div style={{ color: "#e0f7ff", fontFamily: "Poppins, sans-serif", fontSize: "0.85rem", maxWidth: "190px", lineHeight: 1.65, margin: "0 auto", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            Cuéntanos tu proyecto y te respondemos en minutos
          </div>
        </div>
      </div>}

      {!isMobile && <div className={`image image-right ${startAnimation ? "animate-right" : ""}`} style={{
        width: "50%", height: "100%",
        background: "linear-gradient(200deg, #000d1a 0%, #001a3d 50%, #002d70 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(0,200,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div style={{ position: "relative", textAlign: "center", padding: "0 32px", zIndex: 10 }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px", filter: "drop-shadow(0 0 20px rgba(0,220,255,0.9)) brightness(1.3)" }}>🚀</div>
          <div style={{ fontSize: "0.65rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase", color: "#00e5ff", marginBottom: "10px", textShadow: "0 0 16px rgba(0,229,255,0.8)" }}>
            JUNTOS
          </div>
          <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: "2rem", lineHeight: 1.15, marginBottom: "6px", color: "#ffffff", textShadow: "0 0 24px rgba(0,200,255,0.6), 0 2px 4px rgba(0,0,0,0.9)" }}>
            Trabajemos juntos
          </div>
          <div style={{ width: "40px", height: "2px", background: "linear-gradient(90deg, #00dcff, transparent)", margin: "0 auto 14px auto", borderRadius: "2px" }} />
          <div style={{ color: "#e0f7ff", fontFamily: "Poppins, sans-serif", fontSize: "0.85rem", maxWidth: "190px", lineHeight: 1.65, margin: "0 auto", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            Sitios web modernos con entrega en 72 horas
          </div>
        </div>
      </div>}

      {!isMobile && !startAnimation && (
        <Box
          sx={{
            position: "absolute", // clave para que se ancle al Container
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            pointerEvents: "none", // opcional para que no bloquee clics
          }}
        >
          <div id="loader" />
        </Box>
      )}




      <Box
          sx={{
            opacity: startAnimation ? 1 : 0,
            pointerEvents: startAnimation ? "auto" : "none",
            transition: "opacity 0.8s ease-in-out, transform 0.8s ease-in-out",
            transform: startAnimation ? "translateY(0)" : "translateY(40px)",
          }}
        >
          < Box sx={{ position: "relative", zIndex: 2, paddingTop: "20px", display: "flex", flexDirection: "column", height: "100%" }}>

            {!formSubmitted && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                {/* Label con líneas — estilo "Tecnología que integramos" */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1.2 }}>
                  <Box sx={{ flex: 1, maxWidth: 60, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5))" }} />
                  <Typography sx={{
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase",
                    fontFamily: "'Poppins', sans-serif",
                    background: "linear-gradient(90deg, #38bdf8, #00e5ff)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    Contáctanos
                  </Typography>
                  <Box sx={{ flex: 1, maxWidth: 60, height: "1px", background: "linear-gradient(90deg, rgba(0,212,255,0.5), transparent)" }} />
                </Box>

                {/* Título principal */}
                <Typography sx={{
                  fontFamily: "'Poppins', sans-serif", fontWeight: 800,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                  color: "white", lineHeight: 1.2, mb: 0.5,
                }}>
                  Cuéntanos tu proyecto
                </Typography>

                {/* Subtítulo */}
                <Typography sx={{
                  fontSize: { xs: "0.82rem", md: "0.9rem" },
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.5,
                }}>
                  Te respondemos en menos de 24 horas
                </Typography>
              </Box>
            )}

            {!formSubmitted ? (
              <Grid container spacing={4} alignItems="stretch">
                {/* Mapa */}
                <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column" }}>
                  <motion.div
                    ref={ref}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: rotate }}
                    transition={{
                      rotateY: { duration: 1.5, ease: "easeInOut" },
                    }}
                    style={{
                      position: "relative",
                      width: "100%",
                      flex: 1,
                      minHeight: isMobile ? "40vh" : "300px",
                      perspective: 1200,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* ✅ Cara frontal: Mapa */}
                    <motion.div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#fff",
                        borderRadius: 5,
                        border: "1px solid #30363D",
                        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)", // Sombra sutil
                        overflow: "hidden",
                        transform: "rotateY(0deg)",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <Box sx={{ width: "100%", height: "100%" }}>
                        <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
                          {inView && (
                            <MapContainer
                              center={sucursales[activeSucursal].coords}
                              zoom={16}
                              style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                              }}
                              dragging={false}
                              scrollWheelZoom={false}
                              touchZoom={false}
                              doubleClickZoom={false}
                              zoomControl={false}
                              whenCreated={() => setMapLoaded(true)}
                            >

                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                subdomains={["a", "b"]}
                                maxZoom={17}
                                noWrap
                                updateWhenIdle
                              />

                              {/* 📍 Siempre visible */}
                              <Marker position={sucursales[0].coords} icon={sucursales[0].icon} />

                              {/* 📍 Otras sucursales cuando ya se mostraron */}
                              {activeSucursal > 0 &&
                                sucursales.slice(1).map((s, i) => (
                                  <Marker key={i + 1} position={s.coords} icon={s.icon} />
                                ))}

                              <ZoomEffect zoom={finalZoom} position={sucursales[activeSucursal].coords} />
                              <MapClickHandler />

                              <AnimatePresence mode="wait">
                                {showBanner && (
                                  <motion.div
                                    key={activeSucursal}
                                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: -8 }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                    style={{
                                      position: "absolute",
                                      top: isMobile ? "14%" : "18%",
                                      left: 0,
                                      right: 0,
                                      margin: "0 auto",
                                      width: isMobile ? "190px" : "230px",
                                      background: "linear-gradient(135deg, rgba(0,10,30,0.92) 0%, rgba(0,30,70,0.92) 100%)",
                                      backdropFilter: "blur(12px)",
                                      border: "1px solid rgba(0,200,255,0.35)",
                                      borderRadius: "12px",
                                      padding: "10px 16px 12px",
                                      textAlign: "center",
                                      boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(0,180,255,0.15)",
                                      zIndex: 1000,
                                      pointerEvents: "none",
                                    }}
                                  >
                                    {/* Dot indicador */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "5px" }}>
                                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5ff", boxShadow: "0 0 8px #00e5ff", animation: "pulse 1.5s infinite" }} />
                                      <span style={{ fontSize: "0.6rem", fontFamily: "Poppins, sans-serif", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#00e5ff" }}>
                                        En vivo
                                      </span>
                                    </div>
                                    <div style={{ color: "#ffffff", fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: isMobile ? "0.8rem" : "0.88rem", lineHeight: 1.3 }}>
                                      {sucursales[activeSucursal].text}
                                    </div>
                                    {/* Flecha */}
                                    <div style={{
                                      position: "absolute", bottom: "-8px", left: "50%", transform: "translateX(-50%)",
                                      width: 0, height: 0,
                                      borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
                                      borderTop: "8px solid rgba(0,30,70,0.92)",
                                    }} />
                                  </motion.div>
                                )}
                              </AnimatePresence>


                              <FlyLoop sucursales={sucursales} interval={6000} zoom={16} activeSucursal={activeSucursal} />
                            </MapContainer>

                          )}
                        </Box>
                      </Box>
                    </motion.div>

                    {/* ✅ Cara trasera: Imagen */}
                    <motion.div
                      style={{
                        position: "absolute",
                        top: isMobile ? 25 : 0,
                        left: isMobile ? 0 : 0,
                        right: isMobile ? 0 : 30,
                        width: "100%",
                        height: "100%",
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <img
                        src="/contacto.webp"
                        alt="Imagen de contacto"
                        style={{
                          width: isMobile ? "100%" : "80%",
                          height: isMobile ? "85%" : "100%",
                          borderRadius: 2,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                </Grid>


                <Grid item xs={12} md={6}>
                  <ContactoForm setSnackbar={setSnackbar} />

                </Grid>

              </Grid>
            ) : (
              <Box sx={{ p: 8, mt: 4, minHeight: "300px", backgroundColor: "#e0f7e9", borderRadius: 2, textAlign: "center", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}>
                <CheckCircleIcon sx={{ fontSize: 180, color: "green", mb: 2 }} />
                <Typography variant="h4" sx={{ color: "black" }}>
                  Se ha enviado su mensaje correctamente! Le hablaremos por WhatsApp y correo a la brevedad.
                </Typography>
              </Box>
            )}

            <Snackbar
              open={snackbar.open}
              autoHideDuration={4000}
              sx={{ zIndex: 1400 }} // 🛡️ Material UI usa 1300 para modales por defecto
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                severity={snackbar.type}
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  fontSize: "0.9rem",
                  boxShadow: 3,
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Box>
    </Container >
  );
}
const ZoomEffect = ({ zoom, startAnimation, position }) => {

  const map = useMapEvent("load", () => { });
  const zoomApplied = useRef(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (!map || !inView || zoomApplied.current || startAnimation) return;

    zoomApplied.current = true;

    const delayTimer = setTimeout(() => {
      let zoomLevel = isMobile ? 7 : 5;
      const zoomSpeed = isMobile ? 0.08 : 0.1;
      const offsetY = isMobile ? 0.0001 : 0;
      const correctedPosition = [position[0] + offsetY, position[1]];

      map.setView(correctedPosition, zoomLevel, {
        animate: true,
        duration: isMobile ? 0.4 : 0.3,
        easeLinearity: 1,
      });

      const animateZoom = () => {
        if (zoomLevel < zoom) {
          zoomLevel += zoomSpeed;
          if (zoomLevel >= zoom) zoomLevel = zoom;

          map.flyTo(correctedPosition, zoomLevel, {
            animate: true,
            duration: isMobile ? 0.4 : 0.3,
            easeLinearity: 1,
          });

          requestAnimationFrame(animateZoom);
        }
      };

      requestAnimationFrame(animateZoom);
    }, 300); // delay antes de empezar animación

    return () => clearTimeout(delayTimer);
  }, [inView, map, zoom, isMobile, startAnimation]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};


export default Contacto;
