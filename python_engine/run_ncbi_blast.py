# python_engine/run_ncbi_blast.py
import sys
import json
from Bio.Blast import NCBIWWW, NCBIXML

def verify_on_ncbi(sequence: str):
    """
    Performs a single, live BLAST search against the global NCBI nt database.
    """
    try:
        print("--- Calling Live NCBI Web BLAST API ---")
        result_handle = NCBIWWW.qblast("blastn", "nt", sequence, megablast=True, hitlist_size=1)
        
        blast_records = list(NCBIXML.parse(result_handle))
        
        if blast_records and blast_records[0].descriptions:
            best_hit = blast_records[0].descriptions[0]
            result = {
                "status": "success",
                "message": "Match found on NCBI.",
                "best_hit_title": best_hit.title,
                "score": best_hit.score,
                "e_value": best_hit.e
            }
        else:
            result = {
                "status": "success",
                "message": "No significant match found on NCBI."
            }
        return result
            
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    sequence_to_verify = sys.argv[1]
    results = verify_on_ncbi(sequence_to_verify)
    print(json.dumps(results))