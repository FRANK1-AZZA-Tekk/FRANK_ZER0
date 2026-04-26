/**
 * FRANK CORTEX 2026 - ESP32 Firmware
 * Hardware: T-Watch S3 / AtomS3R
 * BLE Voice Streamer + IMU Gesture Node
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("FRANK CORTEX: Conectado via BLE");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("FRANK CORTEX: Desconectado");
    }
};

void setup() {
  Serial.begin(115200);
  Serial.println("FRANK CORTEX 2026 - ESP32 Node Booting...");

  // BLE Setup
  BLEDevice::init("FRANK_CORTEX_NODE_0XAF");
  BLEDevice::setMTU(512); // Increase MTU to 512 bytes to optimize data transfer speed
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Aguardando conexão BLE...");
}

void loop() {
  if (deviceConnected) {
    // Mock IMU data stream
    String imuData = "IMU:X=0.01,Y=-0.02,Z=1.00";
    pCharacteristic->setValue(imuData.c_str());
    pCharacteristic->notify();
    delay(100);
  }
}
