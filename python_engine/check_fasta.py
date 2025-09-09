# check_fasta.py
from Bio import SeqIO
import os

FASTA_FILE = os.path.join("data", "golden_dataset.fasta")

try:
    records = list(SeqIO.parse(FASTA_FILE, "fasta"))
    if len(records) == 4:
        print("✅ SUCCESS: The FASTA file was parsed successfully.")
        print(f"Found {len(records)} sequences.")
        for i, record in enumerate(records):
            print(f"  - Sequence {i+1}: ID='{record.id}', Length={len(record.seq)} bp")
    else:
        print(f"⚠️ WARNING: Expected 4 sequences, but found {len(records)}. Please check your file.")

except Exception as e:
    print(f"❌ ERROR: The FASTA file could not be parsed. There is likely a formatting error.")
    print(f"Details: {e}")