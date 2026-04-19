import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const videoConstraints = {
  facingMode: "environment",
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

function Mmansoulet() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      setError("No se pudo capturar la imagen.");
      return;
    }

    setCapturedImage(imageSrc);
    setAnalysis(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!capturedImage) {
      setError("Primero debes capturar una imagen.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: capturedImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo analizar la imagen.");
      }

      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Ocurrió un error al analizar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 3, sm: 8, md: 12 },
        px: { xs: 1.2, sm: 2 },
        background:
          "radial-gradient(circle at top, rgba(41,182,246,0.22), transparent 30%), linear-gradient(180deg, #041422 0%, #0b2740 55%, #0d2233 100%)",
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 0.4, sm: 2 } }}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 1.4, sm: 3.5 },
            borderRadius: { xs: 3.2, sm: 5 },
            background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
            color: "#fff",
            overflow: "hidden",
          }}
        >
          <Stack spacing={2.5}>
            <Box
              sx={{
                p: { xs: 1.2, sm: 2 },
                borderRadius: { xs: 2.6, sm: 4 },
                background:
                  "linear-gradient(135deg, rgba(41,182,246,0.18), rgba(21,101,192,0.08))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  mb: 0.5,
                  fontSize: { xs: "1.35rem", sm: "2.15rem" },
                  lineHeight: 1.08,
                }}
              >
                Demo - mmansoulet
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.82)",
                  fontSize: { xs: "0.82rem", sm: "1rem" },
                  lineHeight: { xs: 1.38, sm: 1.5 },
                }}
              >
                Captura, compara y revisa el análisis.
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    ml: 0.45,
                    fontSize: { xs: "1.12rem", sm: "1.22rem" },
                    transform: "translateY(-2px)",
                    lineHeight: 1,
                  }}
                >
                  📸
                </Box>
              </Typography>
            </Box>

            <Box
              sx={{
                borderRadius: { xs: 2.6, sm: 3 },
                overflow: "hidden",
                backgroundColor: "#000",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                position: "relative",
                aspectRatio: isMobile ? "9 / 14" : "16 / 9",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.16))",
                  pointerEvents: "none",
                },
              }}
            >
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                }}
              />
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={handleCapture}
                sx={{
                  minHeight: { xs: 46, sm: 50 },
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: { xs: "0.9rem", sm: "0.96rem" },
                  borderRadius: { xs: "12px", sm: "14px" },
                  background: "linear-gradient(135deg, #29b6f6, #1565c0)",
                  boxShadow: "0 10px 24px rgba(21,101,192,0.35)",
                }}
              >
                Capturar
              </Button>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={!capturedImage || loading}
                sx={{
                  minHeight: { xs: 46, sm: 50 },
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: { xs: "0.9rem", sm: "0.96rem" },
                  borderRadius: { xs: "12px", sm: "14px" },
                  background: "linear-gradient(135deg, #66bb6a, #2e7d32)",
                  boxShadow: "0 10px 24px rgba(46,125,50,0.35)",
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Analizar"}
              </Button>
            </Stack>

            {capturedImage && (
              <Box>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  Preview capturada
                </Typography>
                <Box
                  component="img"
                  src={capturedImage}
                  alt="Imagen capturada"
                  sx={{
                    width: "100%",
                    borderRadius: { xs: 2.6, sm: 3 },
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
                    maxHeight: { xs: "42vh", sm: "unset" },
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {analysis && (
              <Box
                sx={{
                  p: { xs: 1.35, sm: 2 },
                  borderRadius: { xs: 2.6, sm: 3 },
                  border:
                    analysis.status === "ok"
                      ? "1px solid rgba(102,187,106,0.55)"
                      : "1px solid rgba(255,183,77,0.55)",
                  background:
                    analysis.status === "ok"
                      ? "linear-gradient(180deg, rgba(46,125,50,0.22), rgba(46,125,50,0.1))"
                      : "linear-gradient(180deg, rgba(255,152,0,0.22), rgba(255,152,0,0.1))",
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 0.3 }}>
                  {analysis.message}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.86)", fontSize: { xs: "0.86rem", sm: "1rem" } }}>
                  Diferencia detectada: <strong>{analysis.difference}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default Mmansoulet;
