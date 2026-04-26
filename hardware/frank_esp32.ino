// hardware/frank_esp32.ino
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "bma.h" // BMA423 Accelerometer (T-Watch S3)
#include "axp2101.h" // PMU (T-Watch S3)

const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";
const char* serverUrl = "http://192.168.x.x:8000/sensors";

AXP2101 axp;
BMA423 bma;

void setup() {
  Serial.begin(115200);
  Wire.begin(10, 11); // T-Watch S3 I2C pins

  // Inicializa PMU (AXP2101)
  if (axp.begin(Wire, AXP2101_SLAVE_ADDRESS)) {
    Serial.println("AXP2101 OK");
    axp.setPrechargeCurrent(AXP2101_PRECHARGE_200MA);
    axp.setChargeCurrent(AXP2101_CHG_CUR_500MA);
  }

  // Inicializa BMA423 (Acelerômetro)
  if (bma.begin(Wire, BMA423_SLAVE_ADDRESS)) {
    Serial.println("BMA423 OK");
    bma.enableAccel();
    // Configura interrupção de movimento para acordar do Deep Sleep
    bma.enableFeature(BMA423_ANY_MOTION, true);
    bma.configInterrupt(BMA423_INT1, BMA423_ANY_MOTION, true);
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Lê dados do BMA423
    Accel accel;
    bma.getAccel(accel);

    // Lê bateria do AXP2101
    int batteryLevel = axp.getBatteryPercent();

    StaticJsonDocument<200> doc;
    JsonArray gyro = doc.createNestedArray("gyro");
    gyro.add(accel.x);
    gyro.add(accel.y);
    gyro.add(accel.z);
    doc["battery"] = batteryLevel;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }

  // Otimização de Energia: Deep Sleep (Acorda com movimento ou timer)
  Serial.println("Entrando em Light Sleep por 5s...");
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_14, 1); // Pino de interrupção do BMA423
  esp_sleep_enable_timer_wakeup(5000000); // 5 segundos
  esp_light_sleep_start();
}
