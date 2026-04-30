#include <Arduino.h>
#include <Wire.h>
#include "BMA423.h" 

BMA423 imu;

void setup() {
  Serial.begin(115200);
  Wire.begin(18, 19);
  imu.begin(Wire);
  Serial.println("YBY GESTURE AGENT: ONLINE");
}

void loop() {
  int tilt_x = imu.getAccelX();
  int tilt_y = imu.getAccelY();
  int tilt_z = imu.getAccelZ();
  
  if (abs(tilt_x) > 2000 || abs(tilt_y) > 2000 || abs(tilt_z) > 2000) {
    Serial.println("GESTURE: SHAKE");
    delay(1000);
  } else if (tilt_x > 1000 && abs(tilt_y) < 500 && abs(tilt_z) < 500) {
    Serial.println("GESTURE: FLICK_RIGHT");
    delay(1000);
  } else if (tilt_x < -1000 && abs(tilt_y) < 500 && abs(tilt_z) < 500) {
    Serial.println("GESTURE: FLICK_LEFT");
    delay(1000);
  } else if (tilt_y > 500) {
    Serial.println("GESTURE: TILT_DOWN");
    delay(1000);
  } else if (tilt_y < -500) {
    Serial.println("GESTURE: TILT_UP");
    delay(1000);
  } else if (tilt_z > 1500 && abs(tilt_x) < 500 && abs(tilt_y) < 500) {
    Serial.println("GESTURE: JAW_CLENCH");
    delay(1000);
  }
  
  delay(100);
}
