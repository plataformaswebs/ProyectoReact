import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { styled, keyframes } from "@mui/system";

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0; }
`;

const GreenDot = styled("div")(() => ({
  position: "relative",
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  top: -1,
  backgroundColor: "#00e676",
  boxShadow: "0 0 8px rgba(0,255,0,0.5)",
  marginRight: "10px",
  flexShrink: 0,
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#00e676",
    opacity: 0.6,
    transform: "scale(1)",
    animation: `${pulse} 1.4s ease-out infinite`,
  },
}));

const letterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.4 + i * 0.04 },
  }),
};

const textoAnimado = "Tecnología que integramos";

// imgs[0..7] = planetas, imgs[8] = sol (hosting)
const imgs = [
  "logos-productos/aws.png",
  "logos-productos/SSL.png",
  "logos-productos/webpay.png",
  "logos-productos/google-ads.jpg",
  "logos-productos/google-analytics.png",
  "logos-productos/SEO.png",
  "logos-productos/SQL.jpg",
  "logos-productos/correos.jpg",
  "logos-productos/hosting.jpg",
];

const planets = imgs.slice(0, 8);

export default function OrbitSystem({ isMobile, orbitInViewRef, orbitInView }) {
  const containerSize = isMobile ? 360 : 380;
  const orbitRadius   = isMobile ? 140 : 150;
  const sunSize       = isMobile ? 125 : 140;
  const planetSize    = isMobile ? 76  : 72;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>

      {/* Sistema solar */}
      <Box
        ref={orbitInViewRef}
        sx={{
          position: "relative",
          width: containerSize,
          height: containerSize,
          flexShrink: 0,
        }}
      >
        {/* Anillo orbital — línea punteada sutil */}
        <Box sx={{
          position: "absolute",
          top: "50%", left: "50%",
          width: orbitRadius * 2,
          height: orbitRadius * 2,
          borderRadius: "50%",
          border: "1.5px dashed rgba(255,255,255,0.12)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />

        {/* Halo exterior del sol */}
        <Box sx={{
          position: "absolute",
          top: "50%", left: "50%",
          width: sunSize + 30,
          height: sunSize + 30,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          animation: "solarPulse 3s ease-in-out infinite",
          "@keyframes solarPulse": {
            "0%,100%": { opacity: 0.6, transform: "translate(-50%, -50%) scale(1)" },
            "50%": { opacity: 1, transform: "translate(-50%, -50%) scale(1.15)" },
          },
        }} />

        {/* Sol — Hosting en el centro */}
        <Box sx={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 3,
        }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={orbitInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            whileHover={{ scale: 1.08 }}
            style={{
              width: sunSize, height: sunSize,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fef08a, #fbbf24, #f59e0b, #d97706)",
              boxShadow: "0 0 24px rgba(251,191,36,0.7), 0 0 50px rgba(245,158,11,0.35), 0 0 80px rgba(217,119,6,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px", cursor: "pointer",
            }}
          >
            <img
              src={imgs[8]}
              alt="Hosting"
              style={{
                width: "100%", height: "100%",
                borderRadius: "50%",
                objectFit: "contain",
                background: "white",
                border: "2.5px solid rgba(251,191,36,0.6)",
              }}
            />
          </motion.div>
        </Box>

        {/* Planetas */}
        {planets.map((src, i) => {
          const angle = (2 * Math.PI * i) / planets.length - Math.PI / 2;
          const x = Math.cos(angle) * orbitRadius;
          const y = Math.sin(angle) * orbitRadius;

          return (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                transform: "translate(-50%, -50%)",
                zIndex: 2,
              }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={orbitInView ? {
                  scale: 1, opacity: 1,
                  y: [0, -5, 0],
                  transition: {
                    scale: { duration: 0.5, ease: "easeOut", delay: 0.2 + i * 0.07 },
                    opacity: { duration: 0.5, delay: 0.2 + i * 0.07 },
                    y: { duration: 3 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                  },
                } : { scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.12 }}
                style={{
                  width: planetSize, height: planetSize,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 0 8px rgba(139,92,246,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "3px", cursor: "pointer",
                }}
              >
                <img
                  src={src}
                  alt={`Tech ${i}`}
                  style={{
                    width: "100%", height: "100%",
                    borderRadius: "50%",
                    objectFit: "contain",
                    background: "white",
                    border: "2px solid rgba(139,92,246,0.4)",
                  }}
                />
              </motion.div>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
