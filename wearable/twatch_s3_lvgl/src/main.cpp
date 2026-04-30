#include <Arduino.h>
#include <AsyncMqttClient.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include <WiFi.h>
#include <esp_sleep.h>
#include <lvgl.h>

#include "config.h"

// HUD LVGL v9 para LilyGO T-Watch S3 Plus.
// Objetivo: mostrar status MQTT + CPU/RAM/GPU + bateria + logs com baixo consumo.

TFT_eSPI tft = TFT_eSPI();
AsyncMqttClient mqtt;

constexpr uint32_t UI_TICK_MS = 5;
constexpr uint32_t UI_REFRESH_MS = 1000;
constexpr uint32_t MQTT_RETRY_MS = 3000;
constexpr uint32_t DEEP_SLEEP_AFTER_MS = 30000;
constexpr uint8_t SCREEN_COUNT = 4;

enum ScreenId : uint8_t {
  SCREEN_MQTT = 0,
  SCREEN_SYSTEM = 1,
  SCREEN_BATTERY = 2,
  SCREEN_LOGS = 3,
};

struct HudState {
  bool wifiOk = false;
  bool mqttOk = false;
  float cpu = 0;
  float ram = 0;
  String gpu = "N/A";
  int battery = 0;
  String lastLog = "boot";
};

HudState state;
ScreenId currentScreen = SCREEN_MQTT;
uint32_t lastUiRefresh = 0;
uint32_t lastMqttAttempt = 0;
uint32_t lastMqttSeen = 0;
uint32_t lastTouchMs = 0;

static lv_display_t *display = nullptr;
static lv_indev_t *touchInput = nullptr;
static lv_obj_t *root = nullptr;
static lv_obj_t *titleLabel = nullptr;
static lv_obj_t *line1 = nullptr;
static lv_obj_t *line2 = nullptr;
static lv_obj_t *line3 = nullptr;
static lv_obj_t *logLabel = nullptr;

// Buffer pequeno para 240x240: evita estourar RAM/flash e mantém UI suficiente.
static lv_color_t drawBuffer[240 * 24];

void setBacklight(uint8_t value) {
  // Brilho por PWM. Ajuste TFT_BL no config.h se sua revisão da placa mudar o pino.
  ledcWrite(0, value);
}

void logHud(const String &message) {
  // Mantém uma linha curta para reduzir custo de renderização.
  state.lastLog = message.substring(0, 80);
}

void enterDeepSleep() {
  // Se MQTT sumiu por 30s, dorme 30s. Acorda, reconecta Wi-Fi e assina de novo.
  logHud("mqtt offline // deep sleep 30s");
  setBacklight(BRIGHTNESS_DIM);
  WiFi.disconnect(true);
  esp_sleep_enable_timer_wakeup(30ULL * 1000000ULL);
  esp_deep_sleep_start();
}

void flushDisplay(lv_display_t *disp, const lv_area_t *area, uint8_t *pxMap) {
  // LVGL entrega pixels; TFT_eSPI joga no ST7789.
  uint32_t width = area->x2 - area->x1 + 1;
  uint32_t height = area->y2 - area->y1 + 1;

  tft.startWrite();
  tft.setAddrWindow(area->x1, area->y1, width, height);
  tft.pushColors(reinterpret_cast<uint16_t *>(pxMap), width * height, true);
  tft.endWrite();

  lv_display_flush_ready(disp);
}

void readTouch(lv_indev_t *, lv_indev_data_t *data) {
  // Leitura simples de touch via TFT_eSPI.
  // Em algumas revisões LilyGO, será necessário calibrar o touch no User_Setup.
  uint16_t x = 0;
  uint16_t y = 0;
  bool touched = tft.getTouch(&x, &y);

  data->state = touched ? LV_INDEV_STATE_PRESSED : LV_INDEV_STATE_RELEASED;
  if (touched) {
    data->point.x = x;
    data->point.y = y;
  }
}

lv_obj_t *makeLabel(lv_obj_t *parent, int y, const char *text, const lv_color_t color) {
  lv_obj_t *label = lv_label_create(parent);
  lv_obj_set_style_text_font(label, &lv_font_montserrat_14, 0);
  lv_obj_set_style_text_color(label, color, 0);
  lv_obj_align(label, LV_ALIGN_TOP_LEFT, 10, y);
  lv_label_set_text(label, text);
  return label;
}

void buildUi() {
  // Tema bunker: fundo preto, linhas finas, verde/azul neon e âmbar para alerta.
  root = lv_obj_create(lv_screen_active());
  lv_obj_set_size(root, 240, 240);
  lv_obj_set_style_bg_color(root, lv_color_hex(0x000000), 0);
  lv_obj_set_style_border_color(root, lv_color_hex(0x00ff66), 0);
  lv_obj_set_style_border_width(root, 1, 0);
  lv_obj_set_style_radius(root, 0, 0);
  lv_obj_clear_flag(root, LV_OBJ_FLAG_SCROLLABLE);

  titleLabel = makeLabel(root, 8, "YBY // MQTT", lv_color_hex(0x00ff66));
  line1 = makeLabel(root, 48, "", lv_color_hex(0x00ff66));
  line2 = makeLabel(root, 78, "", lv_color_hex(0x00aaff));
  line3 = makeLabel(root, 108, "", lv_color_hex(0xffb000));
  logLabel = makeLabel(root, 180, "", lv_color_hex(0x00ff66));
}

void renderScreen() {
  switch (currentScreen) {
    case SCREEN_MQTT:
      lv_label_set_text(titleLabel, "YBY // MQTT");
      lv_label_set_text_fmt(line1, "WiFi: %s", state.wifiOk ? "ONLINE" : "OFFLINE");
      lv_label_set_text_fmt(line2, "MQTT: %s", state.mqttOk ? "LINKADO" : "SEM LINK");
      lv_label_set_text(line3, "TOPIC: yby/watch/telemetry");
      break;
    case SCREEN_SYSTEM:
      lv_label_set_text(titleLabel, "YBY // CPU RAM");
      lv_label_set_text_fmt(line1, "CPU Ryzen5: %.1f%%", state.cpu);
      lv_label_set_text_fmt(line2, "RAM 16GB: %.1f%%", state.ram);
      lv_label_set_text_fmt(line3, "GPU GTX1650: %s", state.gpu.c_str());
      break;
    case SCREEN_BATTERY:
      lv_label_set_text(titleLabel, "YBY // BATTERY");
      lv_label_set_text_fmt(line1, "BAT: %d%%", state.battery);
      lv_label_set_text(line2, "SLEEP: 30s sem MQTT");
      lv_label_set_text(line3, state.mqttOk ? "RADIO: ativo" : "RADIO: economia");
      break;
    case SCREEN_LOGS:
      lv_label_set_text(titleLabel, "YBY // LOGS");
      lv_label_set_text(line1, "NEURAL_LOG:");
      lv_label_set_text(line2, state.lastLog.c_str());
      lv_label_set_text(line3, "swipe/touch: proxima tela");
      break;
  }

  lv_label_set_text_fmt(logLabel, "[%u/%u] %s", currentScreen + 1, SCREEN_COUNT, state.lastLog.c_str());
}

void nextScreen() {
  currentScreen = static_cast<ScreenId>((currentScreen + 1) % SCREEN_COUNT);
  renderScreen();
}

void previousScreen() {
  currentScreen = currentScreen == 0
    ? static_cast<ScreenId>(SCREEN_COUNT - 1)
    : static_cast<ScreenId>(currentScreen - 1);
  renderScreen();
}

void handleLocalControls() {
  // Botão físico BACK: volta uma tela. Pull-up interno evita componente extra.
  if (digitalRead(BACK_BUTTON_PIN) == LOW && millis() - lastTouchMs > 350) {
    lastTouchMs = millis();
    previousScreen();
    return;
  }

  // Toque curto avança tela. É o fallback pragmático para swipe.
  uint16_t x = 0;
  uint16_t y = 0;
  if (tft.getTouch(&x, &y) && millis() - lastTouchMs > 450) {
    lastTouchMs = millis();
    nextScreen();
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  logHud("wifi conectando");

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
    delay(250);
  }

  state.wifiOk = WiFi.status() == WL_CONNECTED;
  logHud(state.wifiOk ? "wifi online" : "wifi falhou");
}

void publishPresence() {
  StaticJsonDocument<160> doc;
  doc["node"] = "twatch_s3_plus";
  doc["screen"] = currentScreen;
  doc["mqtt"] = state.mqttOk;

  char payload[160];
  serializeJson(doc, payload);
  mqtt.publish("yby/watch/status", 1, true, payload);
}

void onMqttConnect(bool) {
  state.mqttOk = true;
  lastMqttSeen = millis();
  logHud("mqtt conectado");
  mqtt.subscribe("yby/watch/telemetry", 1);
  mqtt.subscribe("yby/watch/command", 1);
  publishPresence();
}

void onMqttDisconnect(AsyncMqttClientDisconnectReason) {
  state.mqttOk = false;
  logHud("mqtt desconectado");
}

void onMqttMessage(char *topic, char *payload, AsyncMqttClientMessageProperties, size_t len, size_t, size_t) {
  lastMqttSeen = millis();

  String body;
  body.reserve(len + 1);
  for (size_t i = 0; i < len; i++) body += payload[i];

  if (String(topic) == "yby/watch/command") {
    if (body == "next") nextScreen();
    if (body == "sleep") enterDeepSleep();
    mqtt.publish("yby/watch/ack", 1, false, "ok");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    logHud("json invalido");
    return;
  }

  state.cpu = doc["cpu"] | state.cpu;
  state.ram = doc["ram"] | state.ram;
  state.gpu = String(doc["gpu"] | state.gpu.c_str());
  state.battery = doc["battery"] | state.battery;
  logHud("telemetria recebida");
  renderScreen();
}

void connectMqtt() {
  if (!state.wifiOk || mqtt.connected()) return;
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setKeepAlive(60);
  if (strlen(MQTT_USER) > 0) mqtt.setCredentials(MQTT_USER, MQTT_PASSWORD);
  mqtt.connect();
}

void setup() {
  Serial.begin(115200);
  pinMode(BACK_BUTTON_PIN, INPUT_PULLUP);

  pinMode(TFT_BL, OUTPUT);
  ledcSetup(0, 5000, 8);
  ledcAttachPin(TFT_BL, 0);
  setBacklight(BRIGHTNESS_ACTIVE);

  tft.init();
  tft.setRotation(0);

  lv_init();
  display = lv_display_create(240, 240);
  lv_display_set_flush_cb(display, flushDisplay);
  lv_display_set_buffers(display, drawBuffer, nullptr, sizeof(drawBuffer), LV_DISPLAY_RENDER_MODE_PARTIAL);

  touchInput = lv_indev_create();
  lv_indev_set_type(touchInput, LV_INDEV_TYPE_POINTER);
  lv_indev_set_read_cb(touchInput, readTouch);

  buildUi();
  renderScreen();

  mqtt.onConnect(onMqttConnect);
  mqtt.onDisconnect(onMqttDisconnect);
  mqtt.onMessage(onMqttMessage);

  connectWiFi();
  connectMqtt();
}

void loop() {
  lv_timer_handler();
  lv_tick_inc(UI_TICK_MS);
  delay(UI_TICK_MS);
  handleLocalControls();

  uint32_t now = millis();

  if (!mqtt.connected() && now - lastMqttAttempt > MQTT_RETRY_MS) {
    lastMqttAttempt = now;
    if (WiFi.status() != WL_CONNECTED) {
      state.wifiOk = false;
      connectWiFi();
    }
    connectMqtt();
    renderScreen();
  }

  if (now - lastUiRefresh > UI_REFRESH_MS) {
    lastUiRefresh = now;
    renderScreen();
  }

  if (!mqtt.connected() && now - lastMqttSeen > DEEP_SLEEP_AFTER_MS) {
    enterDeepSleep();
  }
}
