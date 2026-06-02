from flask import Flask, request
import urllib.request
import urllib.parse

app = Flask(__name__)

# ThingSpeak Integration Setup
THINGSPEAK_WRITE_KEY = "YQGIUNIEQJFF3ORX"

# In-memory store for the latest sensor readings to forward comprehensive packets
latest_metrics = {
    "temp": "",
    "hum": "",
    "motion": "",
    "gas": ""
}

def forward_to_thingspeak():
    if not THINGSPEAK_WRITE_KEY or THINGSPEAK_WRITE_KEY == "YOUR_WRITE_KEY":
        return
    
    # Map our metrics to ThingSpeak Field positions:
    # Field 1: Temperature
    # Field 2: Humidity
    # Field 3: Gas
    # Field 4: PIR Motion
    params = {
        "api_key": THINGSPEAK_WRITE_KEY,
        "field1": latest_metrics["temp"],
        "field2": latest_metrics["hum"],
        "field3": latest_metrics["gas"],
        "field4": latest_metrics["motion"]
    }
    
    # Filter empty values to not overwrite with blank data
    params = {k: v for k, v in params.items() if v != ""}
    if len(params) <= 1: # Only api_key present
        return

    try:
        query_string = urllib.parse.urlencode(params)
        url = f"https://api.thingspeak.com/update?{query_string}"
        # Execute fire-and-forget/non-blocking request or simple GET
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            status_code = response.getcode()
            print(f"[ThingSpeak] Forwarded successfully. Response code: {status_code}")
    except Exception as e:
        print(f"[ThingSpeak] Error forwarding data: {e}")

@app.route('/sensor1')
def sensor1():
    temp = request.args.get('temp', '')
    hum = request.args.get('hum', '')
    motion = request.args.get('motion', '')

    latest_metrics["temp"] = temp
    latest_metrics["hum"] = hum
    latest_metrics["motion"] = motion

    print(f"Temperature: {temp}")
    print(f"Humidity: {hum}")
    print(f"PIR Motion: {motion}")

    forward_to_thingspeak()

    return "DHT11 and PIR Data Received"


@app.route('/sensor2')
def sensor2():
    gas = request.args.get('gas', '')

    latest_metrics["gas"] = gas

    print(f"MQ2 Gas Value: {gas}")

    forward_to_thingspeak()

    return "MQ2 Gas Data Received"


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)