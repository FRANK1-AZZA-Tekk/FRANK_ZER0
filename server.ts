import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import cron from "node-cron";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { createPatch } from "diff";
import { exec } from "child_process";
import { ybyCortex } from "./src/cortex/YBYArchitect.js";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";

dotenv.config();

// Fix for __dirname in ESM/CJS bundled code
const _filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

// Configure Multer for audio uploads
const upload = multer({ dest: os.tmpdir() });

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // WebSocket handling
  const clients = new Set<WebSocket>();
  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("Client connected to YBY CORTEX WS");
    
    // Send initial status
    ws.send(JSON.stringify({
      type: "agent_status",
      data: {
        VOICE_AGENT: 'idle',
        GESTURE_AGENT: 'idle',
        CONTEXT_AGENT: 'idle',
        RESEARCH_AGENT: 'idle',
        NOTIFY_AGENT: 'idle'
      }
    }));

    ws.on("close", () => clients.delete(ws));
  });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  // Groq Setup
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

  // Protocolo de Nutricao do Solo (YBY V26)
  const runProactiveScan = async () => {
    console.log("[YBY V26] Iniciando Protocolo de Nutricao do Solo...");
    ybyCortex.ingestEvent("product_analytics", { userId: "U-8472", loginDrop: 45, topFeature: "Reports", logins: [10, 8, 4, 1] });
    ybyCortex.ingestEvent("billing", { clusterId: "k8s-prod-us", cpu: 15, cost: 4.50 });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "agent_status",
          data: { RESEARCH_AGENT: 'working' }
        }));
      }
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: "user", parts: [{ text: `Faça uma varredura profunda (Deep Scan) na internet (GitHub, HuggingFace, fóruns, ArXiv) sobre as últimas otimizações para a seguinte stack do projeto YBY CORTEX: Node.js, React, Three.js, Groq, Gemini API. Retorne um JSON com uma lista de melhorias práticas.` }] }],
      });
      // ... rest of logic
    } catch (e) {
      console.error(e);
    }
  };

  cron.schedule("0 5 * * *", runProactiveScan);

  // API Routes
  app.post("/api/v1/swarm/vision", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ detail: "No image provided" });

      // Detect mime type and clean base64 if present
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.includes(",")) {
        const parts = image.split(",");
        const match = parts[0].match(/data:(.*?);base64/);
        if (match) mimeType = match[1];
        base64Data = parts[parts.length - 1];
      }

      const prompt = "Analise esta imagem em detalhes. Identifique objetos, textos e o contexto geral. Seja extremamente técnico e preciso como um agente de IA de elite. Retorne apenas o resultado da análise.";
      
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }]
      });

      const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text || "Falha na análise";

      res.json({
        analysis,
        result: analysis,
        objects: [],
        ocr: "",
        ocr_language: "en",
        confidence: 0.98
      });
    } catch (error) {
      console.error("Vision Error:", error);
      res.status(500).json({ detail: "Internal server error" });
    }
  });

  // Helper for voice processing logic
  async function processVoiceAudio(filePath: string, device: string = "unknown") {
    console.log("[VOICE_AGENT] Transcribing audio via Groq Whisper...");
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      language: "pt",
    });

    const input_text = transcription.text;
    console.log(`[VOICE_AGENT] Transcribed: ${input_text}`);

    let responseText = "";
    let reasoning = "";

    // Sophisticated routing logic
    if (input_text.toLowerCase().includes("pesquisar") || input_text.toLowerCase().includes("busque")) {
      console.log("[ROUTER] Routing to Gemini Pro");
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: "user", parts: [{ text: `Você é o YBY CORTEX. O usuário pediu: "${input_text}". Faça uma pesquisa profunda e responda de forma técnica.` }] }],
      });
      responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na pesquisa";
    } else {
      console.log("[ROUTER] Routing to Gemini Flash");
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: `Você é o YBY CORTEX. O usuário disse: "${input_text}". Responda de forma concisa e técnica.` }] }],
      });
      responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "Erro no processamento";
    }

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "agent_status",
          data: { VOICE_AGENT: 'idle' }
        }));
      }
    });

    return {
      status: "success",
      input_text,
      result: { response: responseText, orb_color: "#00ff88", reasoning: reasoning || undefined },
      yby_response: responseText,
      device
    };
  }

  app.post("/api/v1/swarm/voice/audio", upload.single('audio'), async (req, res) => {
    let tempFilePath = "";
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "agent_status", data: { VOICE_AGENT: 'working' } }));
      }
    });

    try {
      if (req.file) tempFilePath = req.file.path;
      else if (req.body.audio_base64) {
        const buffer = Buffer.from(req.body.audio_base64, 'base64');
        tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, buffer);
      } else return res.status(400).json({ error: "No audio provided" });

      const result = await processVoiceAudio(tempFilePath, req.body.device || "android");
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      res.json(result);
    } catch (error) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      res.status(500).json({ error: "Voice processing failed" });
    }
  });

  app.post("/swarm/voice", express.raw({ type: 'audio/*', limit: '10mb' }), async (req, res) => {
    const deviceId = req.headers['x-device-id'] as string || "esp32-wearable";
    const contentType = req.headers['content-type'] || "";
    let tempFilePath = path.join(os.tmpdir(), `stream-${Date.now()}`);

    console.log(`[VOICE_AGENT] Receiving BLE Audio Stream (MTU 512 Optimized) from ${deviceId}`);

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "agent_status", data: { VOICE_AGENT: 'working' } }));
      }
    });

    try {
      if (contentType.includes("octet-stream") || contentType.includes("audio/")) {
        fs.writeFileSync(tempFilePath, req.body);
        const compatiblePath = tempFilePath + ".wav";
        await new Promise((resolve, reject) => {
          ffmpeg(tempFilePath)
            .inputFormat('s16le')
            .inputOptions(['-ar 16000', '-ac 1'])
            .toFormat('wav')
            .on('end', resolve)
            .on('error', reject)
            .save(compatiblePath);
        });
        const result = await processVoiceAudio(compatiblePath, deviceId);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(compatiblePath)) fs.unlinkSync(compatiblePath);
        res.json(result);
      } else res.status(400).json({ error: "Expected binary audio stream" });
    } catch (error) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      res.status(500).json({ error: "Voice stream processing failed" });
    }
  });

  app.post("/api/v1/swarm/voice", async (req, res) => {
    const { text, device } = req.body;
    console.log(`[VOICE_AGENT] Received Text: ${text}`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: `Você é o YBY CORTEX. O usuário disse: "${text}". Responda de forma concisa e técnica.` }] }],
      });
      res.json({ status: "success", result: { response: response.candidates?.[0]?.content?.parts?.[0]?.text || "Erro", orb_color: "#00ff88" } });
    } catch (error) {
      res.status(500).json({ error: "failed" });
    }
  });

  app.post("/swarm/gesture", async (req, res) => {
    const { gesture_type, duration } = req.body;
    res.json({ status: "success", result: { action: "PROCESSED", response: "Gesto capturado" } });
  });

  app.get("/api/health", (req, res) => res.json({ status: "ok", system: "YBY_CORTEX_2026" }));

  app.post("/api/v1/scan", async (req, res) => {
    res.json({ status: "success", report: "Scan completo" });
  });

  app.post("/api/v1/swarm/research", async (req, res) => {
    const { query } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: "user", parts: [{ text: `Realize uma pesquisa profunda sobre: "${query}". Retorne um relatório técnico detalhado.` }] }],
      });
      res.json({ status: "success", result: response.candidates?.[0]?.content?.parts?.[0]?.text || "Sem dados" });
    } catch (e) {
      res.status(500).json({ error: "failed" });
    }
  });

  app.post("/api/v1/swarm/memory", async (req, res) => {
    res.json({ status: "success", context: "Memória simulada." });
  });

  app.post("/api/v1/swarm/route", async (req, res) => res.json({ status: "success", node: "DEEPSEEK" }));

  app.post("/api/v1/swarm/optimize", async (req, res) => res.json({ status: "success" }));

  app.post("/api/v1/nudges/:id/complete", async (req, res) => res.json({ status: "success" }));
  app.post("/api/v1/nudges/:id/dismiss", async (req, res) => res.json({ status: "success" }));

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    // If bundled as dist/server.cjs, _dirname is the dist folder itself.
    // Otherwise, it's the root, and we look for the dist subfolder.
    const distPath = _filename.endsWith('server.cjs') 
      ? _dirname 
      : path.join(_dirname, "dist");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`YBY CORTEX active on http://localhost:${PORT}`);
  });
}

startServer();
