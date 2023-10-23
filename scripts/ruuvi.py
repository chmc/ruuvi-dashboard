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
from ruuvitag_sensor.ruuvi import RuuviTagSensor

# Parse command-line arguments
parser = argparse.ArgumentParser(description="Process a list of MAC addresses.")
parser.add_argument("--macs", type=str, help="Comma-separated list of MAC addresses")

args = parser.parse_args()

# Check if the 'macs' argument was provided
if args.macs:
    # Split the comma-separated string into a list of MAC addresses
    macs = args.macs.split(",")
    print("MAC addresses:", macs)
else:
    print("No MAC addresses provided.")

# This should be enough that we find at least one result for each
timeout_in_sec = 10

url = "http://localhost:3001/api/ruuvi"

datas = RuuviTagSensor.get_data_for_sensors(macs, timeout_in_sec)

# Use Requests to POST datas in json-format
requests.post(url, json=datas)
# print (datas)
exit()
