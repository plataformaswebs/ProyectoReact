import { Box, Typography } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";

function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

export default function ChatMessage({ from, text, image, video, status, timestamp }) {

    const isUser = from === "user";
    const safeText = text ?? "";
    const { cleanText, links } = extractLinks(safeText);

    if (!cleanText && links.length === 0 && !image && !video) return null;

    const renderStatusIcon = () => {
        if (!isUser) return null;
        if (status === "sent") return <DoneIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "delivered") return <DoneAllIcon sx={{ fontSize: 14, color: "#8696a0" }} />;
        if (status === "seen") return <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb" }} />;
        return null;
    };

    function extractLinks(text) {
        if (!text) return { cleanText: "", links: [] };

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        const links = text.match(urlRegex) || [];
        const cleanText = text.replace(urlRegex, "").trim();

        return { cleanText, links };
    }

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                mb: 1.2,

                animation: isUser
                    ? "slideFromRight .75s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "slideFromLeft .75s cubic-bezier(0.22, 1, 0.36, 1)",

                "@keyframes slideFromLeft": {
                    "0%": {
                        opacity: 0,
                        transform: "translateX(-28px)",
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                },

                "@keyframes slideFromRight": {
                    "0%": {
                        opacity: 0,
                        transform: "translateX(28px)",
                    },
                    "100%": {
                        opacity: 1,
                        transform: "translateX(0)",
                    },
                },
            }}
        >


            <Box
                sx={{
                    maxWidth: {
                        xs: "90%",   // móvil
                        sm: "85%",   // tablet
                        md: "80%",   // laptop
                        lg: "70%",   // desktop grande
                    },
                    minWidth: 120,
                    px: 1.5,
                    pt: 1,
                    pb: image || video
                        ? 2.8
                        : (cleanText || links.length > 0)
                            ? 2.6
                            : 1.2,
                    pr: isUser ? 7.6 : 6,
                    borderRadius: 2,
                    backgroundColor: image && !cleanText ? "transparent" : isUser ? "#E0FBFF" : "#fff",
                    boxShadow: image && !cleanText ? "none" : "0 1px 1px rgba(0,0,0,0.1)",
                    position: "relative",
                    minHeight: 32
                }}
            >



                {cleanText && (
                    <Typography
                        variant="body2"
                        sx={{
                            lineHeight: 1.35,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                        }}
                    >
                        {cleanText.split(/(\*[^*]+\*)/g).map((part, i) => {
                            if (part.startsWith("*") && part.endsWith("*")) {
                                // quitar los asteriscos y poner en negrita
                                const boldText = part.slice(1, -1);
                                return <strong key={i}>{boldText}</strong>;
                            }
                            return part;
                        })}
                    </Typography>
                )}


                {links.map((link, index) => {
                    const formattedLink = link.startsWith("http")
                        ? link
                        : `https://${link}`;

                    return (
                        <Typography
                            key={index}
                            variant="body2"
                            component="a"
                            href={formattedLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: "block",
                                mt: cleanText ? 1 : 0,
                                color: "#0b93f6",
                                textDecoration: "underline",
                                wordBreak: "break-word",
                                cursor: "pointer"
                            }}
                        >
                            {link}
                        </Typography>
                    );
                })}


                {image && (
                    <Box
                        component="img"
                        src={image}
                        alt="Imagen"
                        sx={{
                            width: "100%",
                            maxWidth: 260,
                            borderRadius: 2,
                            mt: safeText ? 1 : 0.5
                        }}
                    />
                )}

                {video && (
                    <Box
                        component="video"
                        src={video}
                        controls
                        autoPlay
                        muted
                        loop
                        sx={{
                            width: "100%",
                            maxWidth: 260,
                            borderRadius: 2,
                            mt: text || image ? 1 : 0.5
                        }}
                    />
                )}

                {/* Hora + checks */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 4,
                        right: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.45
                    }}
                >

                    <Typography
                        variant="caption"
                        sx={{ color: "#667781", fontSize: "0.65rem", lineHeight: 1 }}
                    >
                        {formatTime(timestamp)}
                    </Typography>
                    {renderStatusIcon()}
                </Box>
            </Box>

        </Box>
    );
}
