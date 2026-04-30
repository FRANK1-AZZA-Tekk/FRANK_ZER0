#include <Arduino.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <WiFi.h>

#include "config.h"

// Firmware base para Lilygo T-Watch S3 Plus como Wearable Node do YBY.
// Escopo deliberadamente pequeno: somente Wi-Fi, LCD e HTTP do relogio.

TFT_eSPI tft = TFT_eSPI();

constexpr uint32_t POLL_INTERVAL_MS = 5000;
constexpr uint32_t IDLE_DIM_MS = 30000;
constexpr uint8_t BRIGHTNESS_ACTIVE = 180;
constexpr uint8_t BRIGHTNESS_DIM = 35;

uint32_t lastPoll = 0;
uint32_t lastInteraction = 0;
bool dimmed = false;

struct Telemetry {
  String cpu = "--";
  String ram = "--";
  String gpu = "N/A";
  String link = "BOOT";
};

Telemetry telemetry;

void setBacklight(uint8_t value) {
  // Muitos firmwares T-Watch usam PWM no pino de backlight definido pela placa.
  // Se sua variante usar outro pino, ajuste TFT_BL em config.h.
  ledcWrite(0, value);
}

void drawFrame() {
  // Renderização Bunker Digital: fundo preto, bordas sólidas e texto legível.
  tft.fillScreen(TFT_BLACK);
  tft.drawRect(0, 0, tft.width(), tft.height(), TFT_GREEN);
  tft.drawFastHLine(0, 34, tft.width(), TFT_GREEN);

  tft.setTextDatum(TL_DATUM);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("YBY // WEARABLE_NODE", 8, 8, 2);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString("BUNKER DIGITAL", 8, 22, 1);
}

void drawTelemetry() {
  drawFrame();

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("[SYS_STATUS]", 8, 48, 2);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("CPU Ryzen 5:", 8, 74, 2);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString(telemetry.cpu + "%", 138, 74, 2);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("RAM 16GB:", 8, 104, 2);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString(telemetry.ram + "%", 138, 104, 2);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("GPU GTX1650:", 8, 134, 2);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString(telemetry.gpu, 138, 134, 2);

  tft.setTextColor(telemetry.link == "ONLINE" ? TFT_GREEN : TFT_RED, TFT_BLACK);
  tft.drawString("LINK: " + telemetry.link, 8, 178, 2);
}

String extractJsonNumber(const String &json, const String &key) {
  // Parser propositalmente simples para economizar memória no ESP32.
  // Procura por "key":numero e retorna o número como texto.
  int keyIndex = json.indexOf(key);
  if (keyIndex < 0) return "--";

  int colon = json.indexOf(':', keyIndex);
  if (colon < 0) return "--";

  int start = colon + 1;
  while (start < json.length() && (json[start] == ' ' || json[start] == '"')) start++;

  int end = start;
  while (end < json.length() && (isDigit(json[end]) || json[end] == '.')) end++;

  return json.substring(start, end);
}

void fetchStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    telemetry.link = "WIFI_FAIL";
    setBacklight(BRIGHTNESS_DIM);
    dimmed = true;
    drawTelemetry();
    return;
  }

  HTTPClient http;
  String url = String(YBY_API_BASE) + "/status";

  // HTTPClient faz a requisição GET para o FastAPI do PC.
  // Timeout curto: se a rede cair, o relógio não fica travado esperando.
  http.setTimeout(2500);
  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    telemetry.cpu = extractJsonNumber(payload, "\"usage_percent\"");

    int ramIndex = payload.indexOf("\"ram\"");
    String ramPayload = ramIndex >= 0 ? payload.substring(ramIndex) : payload;
    telemetry.ram = extractJsonNumber(ramPayload, "\"used_percent\"");

    int gpuIndex = payload.indexOf("\"gpu\"");
    String gpuPayload = gpuIndex >= 0 ? payload.substring(gpuIndex) : payload;
    String gpuUsage = extractJsonNumber(gpuPayload, "\"usage_percent\"");
    telemetry.gpu = gpuUsage == "--" ? "N/A" : gpuUsage + "%";

    telemetry.link = "ONLINE";
    lastInteraction = millis();
    if (dimmed) {
      setBacklight(BRIGHTNESS_ACTIVE);
      dimmed = false;
    }
  } else {
    telemetry.link = "API_FAIL";
    setBacklight(BRIGHTNESS_DIM);
    dimmed = true;
  }

  http.end();
  drawTelemetry();
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  telemetry.link = "WIFI...";
  drawTelemetry();

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
  }

  telemetry.link = WiFi.status() == WL_CONNECTED ? "ONLINE" : "WIFI_FAIL";
  drawTelemetry();
}

void setup() {
  Serial.begin(115200);

  pinMode(TFT_BL, OUTPUT);
  ledcSetup(0, 5000, 8);
  ledcAttachPin(TFT_BL, 0);
  setBacklight(BRIGHTNESS_ACTIVE);

  tft.init();
  tft.setRotation(1);
  tft.setTextFont(2);
  drawTelemetry();

  lastInteraction = millis();
  connectWiFi();
}

void loop() {
  uint32_t now = millis();

  if (now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    fetchStatus();
  }

  // Economia simples: se ficar parado, reduz brilho.
  if (!dimmed && now - lastInteraction > IDLE_DIM_MS) {
    setBacklight(BRIGHTNESS_DIM);
    dimmed = true;
  }

  delay(50);
}
