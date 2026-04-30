/*
  YBY MQTT Watch Subscriber - LilyGO T-Watch S3 Plus

  Objetivo:
  - Conectar no Wi-Fi.
  - Assinar comandos MQTT publicados pelo PC/Termux.
  - Mostrar estado simples no display em estética Bunker Digital.
  - Publicar ACK para confirmar que o relógio recebeu o comando.

  Bibliotecas:
  - WiFi.h: conexão Wi-Fi do ESP32-S3.
  - PubSubClient.h: MQTT leve e consolidado no Arduino.
  - TFT_eSPI.h: display TFT do relógio.

  Sem dependências fora de escopo.
*/

#include <Arduino.h>
#include <PubSubClient.h>
#include <TFT_eSPI.h>
#include <WiFi.h>

// ===== CONFIGURAÇÃO LOCAL =====
// Ajuste estes valores antes de compilar.
const char *WIFI_SSID = "SUA_REDE_WIFI";
const char *WIFI_PASS = "SUA_SENHA_WIFI";
const char *MQTT_HOST = "192.168.1.100";
const uint16_t MQTT_PORT = 1883;

// Identidade e tópicos do nó wearable.
const char *DEVICE_ID = "twatch_s3_plus";
const char *TOPIC_COMMAND = "yby/watch/twatch_s3_plus/cmd";
const char *TOPIC_ACK = "yby/watch/twatch_s3_plus/ack";
const char *TOPIC_STATUS = "yby/watch/twatch_s3_plus/status";

// Energia: se ficar sem MQTT por 30s, entra em deep sleep.
const uint32_t MQTT_TIMEOUT_MS = 30000;
const uint64_t SLEEP_TIME_US = 30ULL * 1000000ULL;

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
TFT_eSPI tft = TFT_eSPI();

String lastCommand = "BOOT";
String linkStatus = "INIT";
uint32_t lastMqttOk = 0;

void drawHud() {
  // Renderização brutalista: fundo preto, borda fina, texto legível.
  tft.fillScreen(TFT_BLACK);
  tft.drawRect(0, 0, tft.width(), tft.height(), TFT_GREEN);
  tft.drawFastHLine(0, 32, tft.width(), TFT_GREEN);

  tft.setTextDatum(TL_DATUM);
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("YBY // MQTT_NODE", 8, 8, 2);

  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString("BUNKER LINK", 8, 22, 1);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("[MQTT_STATUS]", 8, 48, 2);
  tft.setTextColor(linkStatus == "ONLINE" ? TFT_GREEN : TFT_RED, TFT_BLACK);
  tft.drawString(linkStatus, 8, 72, 2);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("[LAST_CMD]", 8, 112, 2);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString(lastCommand.substring(0, 22), 8, 138, 2);

  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.drawString("QoS1 SUB // ACK PUB", 8, 204, 1);
}

void publishStatus(const char *state) {
  // Publica status curto para o PC/Termux observar o relógio.
  String payload = "{\"device\":\"";
  payload += DEVICE_ID;
  payload += "\",\"state\":\"";
  payload += state;
  payload += "\"}";
  mqtt.publish(TOPIC_STATUS, payload.c_str(), true);
}

void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  // Callback chamado quando uma mensagem chega no tópico assinado.
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += static_cast<char>(payload[i]);
  }

  lastCommand = message;
  lastMqttOk = millis();
  linkStatus = "ONLINE";
  drawHud();

  // ACK explícito: PubSubClient não configura QoS no publish,
  // então confirmamos recebimento com uma mensagem separada.
  String ack = "{\"device\":\"";
  ack += DEVICE_ID;
  ack += "\",\"received\":\"";
  ack += message;
  ack += "\"}";
  mqtt.publish(TOPIC_ACK, ack.c_str());
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  linkStatus = "WIFI...";
  drawHud();

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
  }

  linkStatus = WiFi.status() == WL_CONNECTED ? "WIFI_OK" : "WIFI_FAIL";
  drawHud();
}

void connectMqtt() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);

  while (!mqtt.connected() && WiFi.status() == WL_CONNECTED) {
    linkStatus = "MQTT...";
    drawHud();

    if (mqtt.connect(DEVICE_ID)) {
      // QoS 1 no subscribe: o broker confirma entrega para comandos.
      mqtt.subscribe(TOPIC_COMMAND, 1);
      publishStatus("online");
      linkStatus = "ONLINE";
      lastMqttOk = millis();
      drawHud();
      return;
    }

    delay(1000);
  }

  linkStatus = "MQTT_FAIL";
  drawHud();
}

void sleepIfOffline() {
  // Se perder MQTT por tempo demais, dorme para economizar bateria.
  if (millis() - lastMqttOk < MQTT_TIMEOUT_MS) return;

  publishStatus("sleep");
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_ORANGE, TFT_BLACK);
  tft.drawString("YBY SLEEP 30S", 8, 8, 2);
  delay(500);

  WiFi.disconnect(true);
  esp_sleep_enable_timer_wakeup(SLEEP_TIME_US);
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  tft.init();
  tft.setRotation(1);
  tft.setTextFont(2);

  drawHud();
  connectWifi();
  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    linkStatus = "WIFI_FAIL";
    drawHud();
    sleepIfOffline();
    return;
  }

  if (!mqtt.connected()) {
    connectMqtt();
  }

  mqtt.loop();
  sleepIfOffline();
  delay(20);
}
