/*
  ESP32 MQTT Sensor Publisher for Secure QoS-Aware Edge IoT Optimizer
  Libraries required in Arduino IDE:
  - WiFi.h
  - PubSubClient by Nick O'Leary

  Note: Arduino C++ does not include HMAC-SHA256 in this minimal sketch.
  For the full security demo, either:
  1) add an HMAC library and generate the same signature as Python security.py, or
  2) publish unsigned demo packets and sign them at a trusted gateway.
*/

#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* MQTT_HOST = "192.168.1.10";
const int MQTT_PORT = 1883;
const char* TOPIC = "iot/packets";

WiFiClient espClient;
PubSubClient client(espClient);

String deviceId = "esp32-a";
unsigned long counter = 0;

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void connectMQTT() {
  while (!client.connected()) {
    String clientId = deviceId + "-client";
    if (!client.connect(clientId.c_str())) {
      delay(1000);
    }
  }
}

String makePacketJson() {
  counter++;
  
  int r = random(0, 4);
  String sensorType;
  float value = 0;
  int priority = 5;
  int sensitivity = 4;
  int deadline = 1500;
  
  if (r == 0) {
    sensorType = "temperature";
    value = 20.0 + random(0, 1500) / 100.0; // 20.0 - 35.0
    priority = 6;
    sensitivity = 3;
    deadline = 2000;
  } else if (r == 1) {
    sensorType = "humidity";
    value = 40.0 + random(0, 4000) / 100.0; // 40.0 - 80.0
    priority = 5;
    sensitivity = 2;
    deadline = 2500;
  } else if (r == 2) {
    sensorType = "gas";
    value = 100 + random(0, 8000) / 10; // 100 - 900
    priority = 9;
    sensitivity = 8;
    deadline = 500;
  } else {
    sensorType = "pir";
    value = random(0, 2); // 0 or 1 for Motion
    priority = 8;
    sensitivity = 7;
    deadline = 800;
  }

  String json = "{";
  json += "\"packet_id\":\"" + deviceId + "-" + String(counter) + "\",";
  json += "\"source\":\"" + deviceId + "\",";
  json += "\"destination\":\"cloud\",";
  json += "\"size_bytes\":512,";
  json += "\"sensor_type\":\"" + sensorType + "\",";
  json += "\"priority\":" + String(priority) + ",";
  json += "\"deadline_ms\":" + String(deadline) + ",";
  json += "\"sensitivity\":" + String(sensitivity) + ",";
  json += "\"payload\":\"{\\\"value\\\":" + String(value) + "}\",";
  json += "\"signature\":null";
  json += "}";
  return json;
}

void setup() {
  randomSeed(analogRead(0));
  connectWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  String payload = makePacketJson();
  client.publish(TOPIC, payload.c_str(), false);
  delay(2000);
}
