import re
import json

with open("scratch/clean.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Find all blocks that look like sub-criteria
# A sub-criteria starts with "CPX.Y"
pattern = re.compile(r'(CP\d+\.\d+\.?.*?)(?=CP\d+\.\d+\.?|$)', re.DOTALL)
matches = pattern.findall(text)

results = {}
for m in matches:
    # Get the CP id
    cp_match = re.search(r'(CP\d+\.\d+)', m)
    if not cp_match: continue
    cp_id = cp_match.group(1)
    
    # Extract the block between Indicator 2 and Indicator 3
    # Indicator 2 ends with "Ya  ☐   Tidak"
    # Indicator 3 starts with "3 "
    block_match = re.search(r'2.*?Ya\s*☐\s*Tidak\s*(.*?)\n\s*3\s+', m, re.DOTALL)
    if block_match:
        block = block_match.group(1)
        # Clean up the block: replace newlines with spaces, fix hyphenation
        clean_block = re.sub(r'\n\s*', ' ', block)
        clean_block = re.sub(r'-\s+', '', clean_block)
        clean_block = re.sub(r'\s+', ' ', clean_block).strip()
        results[cp_id] = clean_block

with open("scratch/extracted_options.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)
