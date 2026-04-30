import paho.mqtt.client as mqtt
import json
import requests

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
VOICE_TOPIC = "yby/atoms3r/voice"

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(VOICE_TOPIC)

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"Received voice payload: {payload}")
    try:
        # Forward to FastAPI swarm
        res = requests.post("http://localhost:8000/swarm/voice", json={
            "audio_text": payload,
            "device": "atoms3r"
        })
        print(f"Swarm response: {res.json()}")
    except Exception as e:
        print(f"Error forwarding to swarm: {e}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

def start_mqtt():
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()

if __name__ == "__main__":
    start_mqtt()
    while True:
        pass
