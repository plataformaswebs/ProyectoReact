import { Box, Typography, Container, Grid, ListItem, ListItemIcon, ListItemText, useMediaQuery, useTheme } from "@mui/material";
import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';
import Public from '@mui/icons-material/Public';
import GroupAdd from '@mui/icons-material/GroupAdd';
import Verified from '@mui/icons-material/Verified'
import DashboardCustomize from '@mui/icons-material/DashboardCustomize';
import "./css/Informations.css";
import OrbitSystem from './OrbitSystem';

const iconItems = [
  {
    icon: <Public sx={{ color: "white", fontSize: "2.2rem" }} />,
    text: "Muestra tu negocio al mundo.",
    desc: "Haz visible tu marca con presencia digital moderna y profesional.",
    hideLine: false,
  },
  {
    icon: <GroupAdd sx={{ color: "white", fontSize: "2.2rem" }} />,
    text: "Atrae más clientes potenciales.",
    desc: "Conecta con clientes ideales mediante estrategias digitales inteligentes.",
    hideLine: false,
  },
  {
    icon: <Verified sx={{ color: "white", fontSize: "2.2rem" }} />,
    text: "Gana la confianza de tus clientes.",
    desc: "Refleja confianza mostrando tu negocio de forma clara y profesional.",
    hideLine: false,
  },
  {
    icon: <DashboardCustomize sx={{ color: "white", fontSize: "2.2rem" }} />,
    text: "Administra y potencia tu negocio.",
    desc: "Toma decisiones con herramientas de monitoreo y gestión digital.",
    hideLine: true,
  },
];

const AnimatedIconItem = memo(function AnimatedIconItem({ item, index, isMobile }) {
  const { ref: itemRef, inView: itemInView } = useInView({
    threshold: 0.43,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, y: 28 }}
      animate={itemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        delay: 0.25 * index,
        duration: 0.6,
        ease: "easeOut",
      }}
    >
      <ListItem
        sx={{
          display: "flex",
          alignItems: "center",
          zIndex: 2,
          paddingLeft: isMobile ? "0" : "16px",
          paddingRight: isMobile ? "0" : "16px",
          py: isMobile ? 1 : 1.5,
          gap: 1.5,
        }}
      >
        <ListItemIcon sx={{ zIndex: 2 }}>
          <Box
            sx={{
              position: "relative",
              width: 100,
              height: 85,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!item.hideLine && (
              <motion.div
                initial={{ height: 0 }}
                animate={itemInView ? { height: 40 } : { height: 0 }}
                transition={{
                  delay: 0.25 * index,
                  duration: 1,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: "80%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "2px",
                  backgroundImage:
                    "linear-gradient(white 40%, rgba(255,255,255,0) 0%)",
                  backgroundPosition: "left",
                  backgroundSize: "2px 6px",
                  backgroundRepeat: "repeat-y",
                  zIndex: 1,
                }}
              />
            )}

            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "2px solid white",
                background: "rgb(6 31 53)",
                boxShadow: "0 0 15px rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
                zIndex: 2,
              }}
            >
              {item.icon}

              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 75,
                  height: 75,
                  borderRadius: "50%",
                  border: "5px solid rgba(0, 191, 255, 0.7)",
                  transform: "translate(-50%, -50%)",
                  animation: itemInView ? "onda 2.5s ease-out infinite" : "none",
                  zIndex: 1,
                }}
              />
            </Box>
          </Box>
        </ListItemIcon>

        <ListItemText
          sx={{
            fontFamily: "'Montserrat', Helvetica, Arial, sans-serif !important",
            pr: { xs: 2, sm: 2, md: 3 },
            "& .MuiListItemText-primary": {
              fontSize: isMobile ? "1rem" : "1.2rem",
            },
            "& .MuiListItemText-secondary": {
              color: "white",
              lineHeight: 1.4,
            },
          }}
          primary={item.text}
          secondary={item.desc}
        />
      </ListItem>
    </motion.div>
  );
});


function Informations({ informationsRef, triggerInformations, setHasSeenInformations }) {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: false });
  const { ref: orbitInViewRef, inView: orbitInView } = useInView({ threshold: 0.2, triggerOnce: true });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [hasAnimated2, setHasAnimated2] = useState(false);

  useEffect(() => {
    if (inView && !hasAnimated2) {
      const timer = setTimeout(() => {
        setHasAnimated2(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [inView, hasAnimated2]);

  return (
    <Box
      ref={informationsRef}
      sx={{
        position: "relative",
        zIndex: 3,
        py: isMobile ? 8 : 3,
        pb: { xs: 0, md: 1 },
        pt: { xs: 2, md: 3 },
        color: "white",

        backgroundImage: `
      linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
    `,
        backgroundSize: "50px 50px",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
        backgroundColor: "rgba(6,31,53,0.95)",

        borderBottomLeftRadius: isMobile ? "90px" : "120px",
        borderBottomRightRadius: isMobile ? "90px" : "120px",
        overflow: "hidden",
        isolation: "isolate",

        "& > *": {
          position: "relative",
          zIndex: 3,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: isMobile ? "140px" : "160px",
          borderBottomLeftRadius: isMobile ? "90px" : "120px",
          borderBottomRightRadius: isMobile ? "90px" : "120px",
          borderBottom: "3px solid rgba(0,255,255,0.85)",
          background:
            "linear-gradient(to bottom, rgba(6,31,53,0) 0%, rgba(0,40,80,0.9) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        },

        "&::before": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "120px",
          borderBottomLeftRadius: isMobile ? "90px" : "120px",
          borderBottomRightRadius: isMobile ? "90px" : "120px",
          background:
            "linear-gradient(to bottom, rgba(6,31,53,0) 0%, rgba(6,31,53,0.85) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        },
      }}
    >
      <Container sx={{ textAlign: "center", color: "white", maxWidth: "1400px !important", paddingLeft: isMobile ? "0" : "24px", paddingRight: isMobile ? "0" : "24px" }}>

        <Box sx={{ textAlign: "center", mb: 3 }} ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView || hasAnimated2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Label con líneas */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1.5 }}>
              <Box sx={{ flex: 1, maxWidth: 80, height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.5))" }} />
              <Typography sx={{
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase",
                fontFamily: "'Poppins', sans-serif",
                background: "linear-gradient(90deg, #38bdf8, #00e5ff)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Tecnología que integramos
              </Typography>
              <Box sx={{ flex: 1, maxWidth: 80, height: "1px", background: "linear-gradient(90deg, rgba(0,212,255,0.5), transparent)" }} />
            </Box>

            {/* Título */}
            <Typography sx={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 800,
              fontSize: { xs: "1.6rem", md: "2rem" },
              color: "white", lineHeight: 1.2, mb: 1,
            }}>
              Impulsa tu negocio con tecnología
            </Typography>

            {/* Subtítulo */}
            <Typography sx={{
              fontSize: { xs: "0.85rem", md: "0.95rem" },
              color: "rgba(255,255,255,0.6)",
              maxWidth: 460, mx: "auto", lineHeight: 1.6,
            }}>
              Herramientas modernas para que tu sitio crezca, rinda y destaque
            </Typography>
          </motion.div>
        </Box>

        <Grid container spacing={3} sx={{ mt: 2 }}>

          {/* Columna izquierda: íconos animados */}
          <Grid item xs={12} md={6}>
            {iconItems.map((item, index) => (
              <AnimatedIconItem
                key={`animated-${index}`}
                item={item}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </Grid>

          {/* Columna derecha: OrbitSystem */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              position: "relative",
              width: "100%",
              height: isMobile ? 480 : 460,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mt: { xs: 6, md: 4 },
            }}>
              <OrbitSystem
                isMobile={isMobile}
                orbitInViewRef={orbitInViewRef}
                orbitInView={orbitInView}
              />
            </Box>
          </Grid>

        </Grid>

      </Container>
    </Box>
  );
};

export default Informations;
