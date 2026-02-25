import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatContainer({ messages, isTyping }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: isTyping ? "auto" : "smooth",
            block: "end",
        });
    }, [messages, isTyping]);

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                px: 2,
                py: 2,
                pb: 6,
                backgroundImage: `
  repeating-linear-gradient(
    90deg,
    rgba(170,230,255,.35),
    rgba(170,230,255,.35) 1px,
    transparent 1px,
    transparent 32px
  ),
  repeating-linear-gradient(
    rgba(170,230,255,.22),
    rgba(170,230,255,.22) 1px,
    transparent 1px,
    transparent 32px
  )
`,
                backgroundSize: "32px 32px",

                filter: "drop-shadow(0 0 6px rgba(170,230,255,.55))",
                animation: "blueprintNeon 18s linear infinite",

                "@keyframes blueprintNeon": {
                    "0%": {
                        backgroundPosition: "0 0",
                        filter: "drop-shadow(0 0 4px rgba(170,230,255,.35))",
                    },
                    "50%": {
                        filter: "drop-shadow(0 0 9px rgba(170,230,255,.8))",
                    },
                    "100%": {
                        backgroundPosition: "32px 32px",
                        filter: "drop-shadow(0 0 4px rgba(170,230,255,.35))",
                    },
                },

                WebkitOverflowScrolling: "touch",
            }}
        >

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5, // separación entre cards
                }}
            >
                {messages
                    .filter(
                        (msg) =>
                            (typeof msg.text === "string" && msg.text.trim().length > 0) ||
                            typeof msg.image === "string" ||
                            typeof msg.video === "string"
                    )
                    .map((msg, i) => (
                        <ChatMessage
                            key={i}
                            from={msg.from}
                            text={msg.text}
                            image={msg.image}
                            video={msg.video}
                            status={msg.status}
                            timestamp={msg.timestamp}
                        />
                    ))}

                {isTyping && <TypingIndicator />}
            </Box>

            <div ref={bottomRef} />
        </Box>
    );
}
