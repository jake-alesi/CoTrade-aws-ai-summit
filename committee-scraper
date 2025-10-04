import requests
import yaml
import csv
from collections import defaultdict

# URLs for the YAML files
LEGISLATORS_URL = "https://unitedstates.github.io/congress-legislators/legislators-current.yaml"
COMMITTEES_URL = "https://unitedstates.github.io/congress-legislators/committee-membership-current.yaml"

# Download YAML files
legislators_data = yaml.safe_load(requests.get(LEGISLATORS_URL).text)
committee_data = yaml.safe_load(requests.get(COMMITTEES_URL).text)

# Map bioguide ID to full name and chamber
bioguide_to_person = {}
for legislator in legislators_data:
    bio_id = legislator.get('id', {}).get('bioguide')
    if bio_id:
        name = legislator.get('name', {}).get('official_full', '')
        chamber = legislator.get('terms', [])[-1].get('type', '')  # 'rep' or 'sen'
        chamber = 'House' if chamber == 'rep' else 'Senate' if chamber == 'sen' else ''
        bioguide_to_person[bio_id] = {'name': name, 'chamber': chamber}

# Map person to committees
person_committees = defaultdict(list)

for committee_id, members in committee_data.items():
    for member in members:
        bio_id = member.get('bioguide')
        if bio_id in bioguide_to_person:
            name = bioguide_to_person[bio_id]['name']
            person_committees[name].append(committee_id)

# Export to CSV
csv_file = "person_committees.csv"
with open(csv_file, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Person", "Chamber", "Committees"])
    
    for name, committees in person_committees.items():
        chamber = ''
        # get chamber from bioguide mapping
        for bio_id, info in bioguide_to_person.items():
            if info['name'] == name:
                chamber = info['chamber']
                break
        writer.writerow([name, chamber, ", ".join(committees)])

print(f"✅ Done! Saved to {csv_file}")