
import json

file_path = 'c:/claude/productivity-tracker/temp_sppg_raw.txt'
output_path = 'c:/claude/productivity-tracker/src/sppg_data.js'
data = []

with open(file_path, 'r') as f:
    lines = f.readlines()
    # Skip header
    for line in lines[1:]:
        parts = line.strip().split('\t')
        if len(parts) >= 2:
            item = {
                'id': parts[0].strip(),
                'name': parts[1].strip(),
                'area': parts[2].strip() if len(parts) > 2 else '',
                'areaConfirmed': parts[3].strip() if len(parts) > 3 else '',
                'priority': parts[4].strip() if len(parts) > 4 else ''
            }
            data.append(item)

js_content = f"export const SPPG_LIST = {json.dumps(data, indent=2)}\n"

with open(output_path, 'w') as f:
    f.write(js_content)

print(f"Written {len(data)} items to {output_path}")
