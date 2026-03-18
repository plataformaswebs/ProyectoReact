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

export default function ChatMessage({ from, text, image, video, status, timestamp, quickReplies, quickRepliesDisabled, onQuickReply }) {

    const isUser = from === "user";
    const safeText = text ?? "";
    const { cleanText, links } = extractLinks(safeText);
    const hasQuickReplies = !isUser && Array.isArray(quickReplies) && quickReplies.length > 0;
    const quickReplyDesign = "design3"; // "design1", "design2" o "design3"
    const quickReplyStyles = {
        design1: {
            border: "1px solid rgba(255,255,255,0.6)",
            background: "linear-gradient(135deg, #12c2e9 0%, #0075ff 50%, #1c64f2 100%)",
            color: "#ffffff",
            hoverShadow: "0 6px 16px rgba(0,117,255,0.35)",
        },
        design2: {
            border: "1px solid rgba(255,255,255,0.35)",
            background: "linear-gradient(135deg, #ffb347 0%, #ff7e5f 50%, #ff5f6d 100%)",
            color: "#1b0b0b",
            hoverShadow: "0 6px 16px rgba(255,126,95,0.35)",
        },
        design3: {
            border: "1px solid rgba(255,255,255,0.45)",
            background: "linear-gradient(135deg, #00c9a7 0%, #00b4d8 50%, #3a86ff 100%)",
            color: "#ffffff",
            hoverShadow: "0 6px 16px rgba(0,180,216,0.35)",
        },
    };
    const qrStyle = quickReplyStyles[quickReplyDesign] || quickReplyStyles.design1;
    const goldStyle = {
        border: "2px solid rgba(255, 213, 79, 0.9)",
        background: "linear-gradient(135deg, #ffd54f, #ff9800 45%, #f57c00 85%)",
        color: "#ffffff",
        hoverShadow: "0 0 6px rgba(255,167,38,.6), inset 0 0 6px rgba(255,255,255,0.25)",
    };

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
                        xs: "90%",
                        sm: "85%",
                        md: "80%",
                        lg: "70%",
                    },
                    minWidth: 120,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 1,
                }}
            >
                <Box
                    sx={{
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

                {hasQuickReplies && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {quickReplies.map((qr, idx) => {
                            const style = qr.variant === "gold" ? goldStyle : qrStyle;
                            return (
                            <Box
                                key={`${qr.value}-${idx}`}
                                component="button"
                                onClick={() => onQuickReply?.(qr.value)}
                                disabled={!!quickRepliesDisabled}
                                sx={{
                                    width: "100%",
                                    borderRadius: "10px",
                                    border: style.border,
                                    background: style.background,
                                    color: style.color,
                                    py: 0.9,
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    cursor: quickRepliesDisabled ? "default" : "pointer",
                                    opacity: quickRepliesDisabled ? 0.6 : 1,
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                    "&:hover": {
                                        transform: quickRepliesDisabled ? "none" : "translateY(-1px)",
                                        boxShadow: quickRepliesDisabled ? "none" : style.hoverShadow,
                                    },
                                    ...(qr.variant === "gold"
                                        ? {
                                            height: "46px",
                                            textTransform: "none",
                                            fontFamily: "Albert Sans, sans-serif",
                                            fontWeight: 600,
                                            position: "relative",
                                            overflow: "hidden",
                                            backgroundSize: "200% 200%",
                                            animation: "gradientShift 8s ease infinite",
                                            boxShadow: "0 6px 16px rgba(255,152,0,.4)",
                                            "&::before": {
                                                content: '""',
                                                position: "absolute",
                                                inset: "-2px",
                                                borderRadius: "inherit",
                                                background:
                                                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.9) 10%, #fff59d 20%, rgba(255,255,255,0.9) 30%, transparent 40%)",
                                                backgroundRepeat: "no-repeat",
                                                backgroundSize: "300% 300%",
                                                animation:
                                                    "shineBorderSweep 3s linear infinite, pulseGlow 4s ease-in-out infinite",
                                                pointerEvents: "none",
                                                zIndex: 2,
                                                mask:
                                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                                maskComposite: "exclude",
                                                WebkitMask:
                                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                                WebkitMaskComposite: "xor",
                                            },
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    "linear-gradient(130deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)",
                                                transform: "translateX(-100%)",
                                                animation: "shineDiagonal 4s ease-in-out infinite",
                                                borderRadius: "inherit",
                                                pointerEvents: "none",
                                                zIndex: 1,
                                            },
                                            "&:hover::after": {
                                                animation: "shineDiagonal 1.2s ease-in-out",
                                            },
                                            "@keyframes shineBorderSweep": {
                                                "0%": { backgroundPosition: "-300% 0" },
                                                "100%": { backgroundPosition: "300% 0" },
                                            },
                                            "@keyframes pulseGlow": {
                                                "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(255,223,0,.35))" },
                                                "50%": { filter: "drop-shadow(0 0 14px rgba(255,223,0,.75))" },
                                            },
                                            "@keyframes shineDiagonal": {
                                                "0%": { transform: "translateX(-120%) rotate(0deg)" },
                                                "100%": { transform: "translateX(120%) rotate(0deg)" },
                                            },
                                            "@keyframes gradientShift": {
                                                "0%": { backgroundPosition: "0% 50%" },
                                                "50%": { backgroundPosition: "100% 50%" },
                                                "100%": { backgroundPosition: "0% 50%" },
                                            },
                                        }
                                        : {}),
                                }}
                            >
                                {qr.label}
                            </Box>
                        );
                        })}
                    </Box>
                )}
            </Box>

        </Box>
    );
}
