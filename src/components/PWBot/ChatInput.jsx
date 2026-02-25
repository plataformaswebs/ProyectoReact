import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";

export default function ChatInput({ onSend }) {
    const [value, setValue] = useState("");

    const handleSend = () => {
        if (!value.trim()) return;
        onSend(value);
        setValue("");
    };

    return (
        <Box
            sx={{
                flexShrink: 0,
                height: 64,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,

                backgroundColor: "rgba(255,255,255,.85)",
                backdropFilter: "blur(6px)",

                borderTop: "1px solid rgba(160,220,255,.35)",
                boxShadow: "0 -2px 10px rgba(160,220,255,.15)",
            }}
        >

            <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Escribe un mensaje…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                size="small"
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 999,
                        backgroundColor: "rgba(240,250,255,.9)",
                        paddingRight: 1,
                        border: "1px solid rgba(160,220,255,.45)",
                        transition: "all .25s ease",

                        "&.Mui-focused": {
                            boxShadow: "0 0 12px rgba(160,220,255,.7)",
                            backgroundColor: "#ffffff",
                        },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                    textarea: {
                        color: "#0f3c4c",
                    },
                }}
            />

            <IconButton
                onClick={handleSend}
                disabled={!value.trim()}
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",

                    bgcolor: value.trim()
                        ? "rgba(160,220,255,.9)"
                        : "rgba(200,220,235,.6)",

                    color: value.trim() ? "#0f3c4c" : "#94a3b8",

                    boxShadow: value.trim()
                        ? "0 0 12px rgba(160,220,255,.9)"
                        : "none",

                    transition: "all .25s ease",

                    "&:hover": {
                        bgcolor: value.trim()
                            ? "rgba(180,235,255,1)"
                            : "rgba(200,220,235,.6)",
                    },
                }}
            >
                <SendIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
