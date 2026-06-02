from flask import Flask, request
import csv
import os
from datetime import datetime

app = Flask(__name__)

CSV_FILE = "data.csv"

if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Time","Temp","Humidity","Motion","Gas"])

@app.route('/sensor1')
def sensor1():

    temp = request.args.get('temp')
    hum = request.args.get('hum')
    motion = request.args.get('motion')

    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            temp,
            hum,
            motion,
            ""
        ])

    return "Sensor1 Saved"


@app.route('/sensor2')
def sensor2():

    gas = request.args.get('gas')

    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "",
            "",
            "",
            gas
        ])

    return "Sensor2 Saved"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)