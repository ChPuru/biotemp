# scripts/fetch_data.py

from Bio import Entrez
from Bio import SeqIO

def fetch_sequences(search_term: str, num_records: int, output_file: str):
    """
    Searches the NCBI Nucleotide database and fetches records as a FASTA file.
    """
    # ALWAYS tell NCBI who you are
    Entrez.email = "your.email@example.com"
    
    print(f"Searching for '{search_term}'...")
    handle = Entrez.esearch(db="nucleotide", term=search_term, retmax=num_records)
    record = Entrez.read(handle)
    handle.close()
    
    id_list = record["IdList"]
    if not id_list:
        print("No records found.")
        return
        
    print(f"Found {len(id_list)} IDs. Fetching records...")
    handle = Entrez.efetch(db="nucleotide", id=id_list, rettype="fasta", retmode="text")
    fasta_records = handle.read()
    handle.close()
    
    with open(output_file, "w") as f:
        f.write(fasta_records)
        
    print(f"Successfully saved {len(id_list)} records to {output_file}")

if __name__ == "__main__":
    # Example usage:
    SEARCH_TERM = '"India marine eDNA"[Title] AND "18S rRNA"[Title]'
    OUTPUT_FILE = "data/sample_data.fasta"
    fetch_sequences(search_term=SEARCH_TERM, num_records=10, output_file=OUTPUT_FILE)