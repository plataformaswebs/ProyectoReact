import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function TypingIndicator() {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                mb: 1,
            }}
        >
            {/* Avatar */}
            <Box
                component="img"
                src="/PWBot.png"
                alt="Bot"
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    objectFit: "cover",
                }}
            />

            {/* Bubble */}
            <Box
                sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "baseline", // 👈 clave
                    gap: 0.5,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "1.2" }}
                >
                    PWBot escribiendo
                </Typography>

                {/* Dots tipo texto */}
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.15 }}>
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                backgroundColor: "#9ca3af",
                                display: "inline-block",
                            }}
                            animate={{
                                opacity: [0.2, 1, 0.2],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.4,
                                delay: i * 0.25,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
