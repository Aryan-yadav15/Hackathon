import re
from rapidfuzz import fuzz, utils
from rapidfuzz.fuzz import partial_ratio_alignment
import json
import sys

products = [
    "Stainless Steel Water Bottle 750mL",
    "Wireless Bluetooth Earbuds Pro",
    "4K Ultra HD Security Camera System",
    "Ergonomic Office Chair (Mesh Back)",
    "Rechargeable LED Camping Lantern",
    "Smart WiFi Programmable Thermostat",
    "Heavy-Duty Wheelbarrow (6 cu ft)",
    "3-Tier Commercial Baking Rack",
    "Industrial Wall-Mounted Tool Cabinet",
    "Hydraulic Floor Jack (3 Ton Capacity)",
    "Stainless Steel Commercial Griddle",
    "Noise-Canceling Over-Ear Headphones",
    "Portable Car Jump Starter 2000A",
    "Commercial-Grade Food Processor",
    "UV Water Purification System"
]

text = '''
Dear Manufacturer,

I hope this email finds you well. My name is Alex Thompson, and I am the purchasing manager for TechTrends Emporium, a leading multi-category retail store located in downtown Seattle. We are looking to restock our inventory with a variety of high-quality products, and based on our market research, your company offers exactly what we need.

We would like to place a bulk order for the following items and quantities:

    Stainless Steel Water Bottle 750mL - 200 units

    Wireless Bluetooth Earbuds Pro - 150 units

    4K Ultra HD Security Camera System - 75 units

    Ergonomic Office Chair (Mesh Back) - 100 units

    Rechargeable LED Camping Lantern - 150 units

    Smart WiFi Programmable Thermostat - 100 units

    Heavy-Duty Wheelbarrow (6 cu ft) - 50 units

    3-Tier Commercial Baking Rack - 30 units

    Industrial Wall-Mounted Tool Cabinet - 40 units

    Hydraulic Floor Jack (3 Ton Capacity) - 60 units

    Stainless Steel Commercial Griddle - 25 units

    Noise-Canceling Over-Ear Headphones - 120 units

    Portable Car Jump Starter 2000A - 80 units

    Commercial-Grade Food Processor - 35 units

    UV Water Purification System - 50 units

Could you please provide us with:

    Current pricing for these quantities

    Available color options or variations for each product

    Estimated delivery timeframe

    Any bulk purchase discounts or promotions currently available

Additionally, we would appreciate information on your warranty policies and return procedures for these products.

We at TechTrends Emporium are excited about the possibility of establishing a long-term business relationship with your company. If you have any questions or need any clarification, please don't hesitate to reach out.

Thank you for your time and attention. We look forward to your response and the opportunity to work together.

Best regards,
'''

productindex = []
for product in products:
    alignment = partial_ratio_alignment(product, text, processor=utils.default_process, score_cutoff=90)
    if alignment is not None:
        dest_start = alignment.dest_start
        dest_end = alignment.dest_end
        productindex.append((product, dest_start, dest_end))
        
def remove_substrings(text, removals):
    removals_sorted = sorted(removals, key=lambda x: x[1], reverse=True)
    for substring, start, end in removals_sorted:
        text = text[:start] + text[end+1:]
    return text

text = remove_substrings(text, productindex)

quantpattern = r'\d{1,6} units|\d{1,6} pack|\d{1,6} meter|\d{1,6} kilogram|\d{1,6} l|\d{1,6} liter|\d{1,6} g|\d{1,6} m|\d{1,6} kg|\d{1,6} l|\d{1,6} ml'
qtfound = re.findall(quantpattern, text)

productindex.sort(key=lambda x: x[1])
op = {}
for i in range(len(productindex)):
    op[productindex[i][0]] = qtfound[i]
    
#Hard code for flag = 0
op['flag'] = 0

# Instead of writing to file, print JSON to stdout
print(json.dumps(op))
sys.stdout.flush()