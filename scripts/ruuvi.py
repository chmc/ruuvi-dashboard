#!/usr/bin/env python3
"""
Get data from sensors and post it to specified url in json-format

Requires:
    Requests - pip install requests

Call:
     python3 scripts/ruuvi.py --macs "mac1,mac2,mac3"
"""

import requests
import argparse
from datetime import datetime
from ruuvitag_sensor.ruuvi import RuuviTagSensor

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Process a list of MAC addresses.")
parser.add_argument("--macs", type=str, help="Comma-separated list of MAC addresses")

args = parser.parse_args()
current_datetime = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")

# Check if the 'macs' argument was provided
if args.macs:
    # Split the comma-separated string into a list of MAC addresses
    macs = args.macs.split(",")
    print(f'{current_datetime} - MAC addresses:', macs)
else:
    print(f'{current_datetime} - No MAC addresses provided.')

# This should be enough that we find at least one result for each
timeout_in_sec = 90

url = "http://localhost:3001/api/ruuvi"

try:
    datas = RuuviTagSensor.get_data_for_sensors(macs, timeout_in_sec)
    print(f'{current_datetime} - Ruuvi sensor data has been fetched', flush=True)
    
    response = requests.post(url, json=datas, timeout=4)
    response.raise_for_status()  # Check for HTTP status code
    print(f'{current_datetime} - Ruuvi sensor data has been POST to API', flush=True)
    
except requests.exceptions.RequestException as e:
    print(f'{current_datetime} - Error making POST request:', e, flush=True)
except Exception as e:
    print(f'{current_datetime} - Error in script:', e, flush=True)

exit(0)
