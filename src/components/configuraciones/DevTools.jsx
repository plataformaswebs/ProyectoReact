import React, { useState, useRef } from "react";
import { Box, Typography, Divider, Tooltip } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const IS_QAS = !import.meta.env.PROD;
const MIN_SHOW_MS = 1500;

export default function DevTools({ checks = [], label = "", loading = false, message = "" }) {
  const [open, setOpen] = useState(false);
  const [displayMsg, setDisplayMsg] = useState("");
  const startRef = useRef(null);
  const timerRef = useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      const msg = e.detail?.message || "";
      if (msg) {
        if (timerRef.current) clearTimeout(timerRef.current);
        startRef.current = Date.now();
        setDisplayMsg(msg);
      } else {
        const elapsed = Date.now() - (startRef.current || 0);
        const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
        timerRef.current = setTimeout(() => setDisplayMsg(""), remaining);
      }
    };
    window.addEventListener("devtools-status", handler);
    return () => {
      window.removeEventListener("devtools-status", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!IS_QAS) return null;

  const hasError   = checks.some(c => c.status === "error");
  const hasLoading = loading || checks.some(c => c.status === "loading");
  const activeMsg  = displayMsg || message;
  const showPill   = hasLoading || !!activeMsg;
  const pillText   = activeMsg || "Cargando...";
  const dotColor   = hasError ? "#ef5350" : (hasLoading || showPill) ? "#ffa726" : "#66bb6a";

  return (
    <>
      {/* Panel de checks */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{ position: "fixed", bottom: 75, right: 15, zIndex: 9999 }}
          >
            <Box sx={{
              bgcolor: "#000",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              minWidth: 220,
              overflow: "hidden",
            }}>
              <Box sx={{ px: 1.5, py: 1, bgcolor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}` }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", flex: 1 }}>
                  QAS Dev Tools
                </Typography>
                {label && (
                  <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                    {label}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />
              <Box sx={{ py: 0.75 }}>
                {checks.length === 0 && (
                  <Typography sx={{ px: 1.5, py: 0.5, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                    Sin checks configurados
                  </Typography>
                )}
                {checks.map((c, i) => (
                  <Box key={i} sx={{ px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 1.25, "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}>
                    <StatusDot status={c.status} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>
                        {c.label}
                      </Typography>
                      {c.detail && (
                        <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.detail}
                        </Typography>
                      )}
                    </Box>
                    <StatusLabel status={c.status} />
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón expansible — crece a la izquierda cuando hay actividad */}
      <Tooltip title={!open && !showPill ? "QAS Dev Tools" : ""} placement="left">
        <motion.div
          layout
          onClick={() => setOpen(o => !o)}
          style={{
            position: "fixed",
            bottom: 10,
            right: 15,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            borderRadius: 999,
            background: "linear-gradient(145deg, #25D366, #1ebe5d)",
            border: "4px solid #ffffff",
            boxShadow: showPill
              ? "0 4px 20px rgba(37,211,102,0.5)"
              : "0 4px 16px rgba(0,0,0,0.35)",
            cursor: "pointer",
            overflow: "hidden",
            minWidth: 55,
            height: 55,
          }}
          whileTap={{ scale: 0.92 }}
          transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        >
          {/* Texto que aparece a la izquierda */}
          <AnimatePresence>
            {showPill && (
              <motion.div
                key="text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: "hidden", flexShrink: 0 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, pl: 1.5, pr: 0.5, whiteSpace: "nowrap" }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>
                    {pillText}
                  </Typography>
                  <Dots />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Círculo con PWBot */}
          <Box sx={{ width: 47, height: 47, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <motion.img
              src="/PWBot.png"
              alt="PWBot"
              animate={showPill ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
              transition={showPill ? { duration: 0.6, ease: "easeInOut" } : { duration: 0.2 }}
              style={{ width: 46, height: 46, objectFit: "contain", display: "block" }}
            />
          </Box>
        </motion.div>
      </Tooltip>
    </>
  );
}

function Dots() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.1, 0.7] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#fff", opacity: 0.8 }}
        />
      ))}
    </Box>
  );
}

function StatusDot({ status }) {
  const colors = { ok: "#66bb6a", error: "#ef5350", loading: "#ffa726", warn: "#ffee58" };
  const color = colors[status] || "#aaa";
  return (
    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, flexShrink: 0, boxShadow: status === "loading" ? `0 0 5px ${color}` : "none" }} />
  );
}

function StatusLabel({ status }) {
  const map = { ok: ["OK", "#66bb6a"], error: ["ERROR", "#ef5350"], loading: ["...", "#ffa726"], warn: ["WARN", "#ffee58"] };
  const [text, color] = map[status] || ["?", "#aaa"];
  return (
    <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color, letterSpacing: "0.05em", flexShrink: 0 }}>
      {text}
    </Typography>
  );
}
