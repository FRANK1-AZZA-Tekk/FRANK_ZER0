#include <Wire.h>
#include "SensorBMA423.hpp"

SensorBMA423 accel;

void setup() {
    Serial.begin(115200);
    Wire.begin(43, 44); // T-Watch S3 I2C pins
    if (!accel.begin(&Wire, BMA423_SLAVE_ADDRESS)) {
        Serial.println("Failed to find BMA423");
        while (1);
    }
    accel.configAccelerometer();
    accel.enableAccelerometer();
    accel.enableFeature(SensorBMA423::FEATURE_STEP_CNTR | SensorBMA423::FEATURE_TILT | SensorBMA423::FEATURE_WAKEUP, true);
}

void loop() {
    int16_t x, y, z;
    if (accel.getAccelerometer(x, y, z)) {
        // Shake detection (high acceleration on multiple axes)
        if (abs(x) > 2000 || abs(y) > 2000 || abs(z) > 2000) {
            Serial.println("GESTURE: SHAKE"); // Cancel / Undo
            delay(500); // Debounce
        } 
        // Flick detection (sudden spike on X axis)
        else if (x > 1000 && abs(y) < 500 && abs(z) < 500) {
            Serial.println("GESTURE: FLICK_RIGHT"); // Next / Skip
            delay(500);
        } 
        else if (x < -1000 && abs(y) < 500 && abs(z) < 500) {
            Serial.println("GESTURE: FLICK_LEFT"); // Previous / Back
            delay(500);
        }
        else if (y > 500) {
            Serial.println("GESTURE: TILT_DOWN"); // Scroll
        } else if (y < -500) {
            Serial.println("GESTURE: TILT_UP");
        }
        
        // Mock Jaw Clench via Z-axis spike
        if (z > 1500 && abs(x) < 500 && abs(y) < 500) {
            Serial.println("GESTURE: JAW_CLENCH"); // OK/Confirm
            delay(500);
        }
    }
    delay(100);
}
