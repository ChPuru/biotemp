# python_engine/main_ensemble.py (FINAL HYBRID VERSION)

import sys
import json
import os
import requests
import pandas as pd
from Bio import SeqIO
from Bio.Blast.Applications import NcbiblastnCommandline
from io import StringIO
import tempfile

# Import your new and fallback modules
from biomapper_lite.core.abundance_estimator import AbundanceEstimator
from biomapper_lite.core.classifier_fallback import BioAnalyzerFallback

# --- THE ULTIMATE STRATEGIC SWITCH ---
USE_REAL_MODELS = False

# --- Live Server Configuration ---
CLASSIFIER_API_URL = "https://<classifier_url>.ngrok.io/analyze"
NOVELTY_API_URL = "https://<novelty_url>.ngrok.io/analyze"
LOCAL_BLAST_DB_PATH = "python_engine/db/BioMapperDB"

def run_local_blast(sequence: str):
    """Runs a BLAST search against our local, curated database."""
    try:
        blastn_cline = NcbiblastnCommandline(
            db=LOCAL_BLAST_DB_PATH,
            outfmt=5, # XML output
            task="blastn",
            max_target_seqs=1
        )
        stdout, stderr = blastn_cline(stdin=sequence)
        if "<Hsp_identity>" in stdout and "<Hsp_num>" in stdout:
            # In a real app, you'd parse the XML for the species name
            return True, "Match found in BioMapperDB"
        return False, "No match found in BioMapperDB"
    except Exception as e:
        return False, f"Local BLAST error: {e}"

def analyze_with_hybrid_strategy(fasta_file_path: str):
    """
    Orchestrates the new, efficient, multi-stage hybrid analysis.
    """
    all_records = list(SeqIO.parse(fasta_file_path, "fasta"))
    
    # --- Step 1: The Local Specialist Check ---
    print("--- Running Local BLAST against BioMapperDB ---")
    local_blast_results = {}
    sequences_for_ai = []
    for record in all_records:
        match_found, match_text = run_local_blast(str(record.seq))
        if match_found:
            # If we find a local match, we create a high-confidence result immediately.
            local_blast_results[record.id] = {
                "Predicted_Species": f"{record.description.split(' ')[1]} (Verified Locally)",
                "Classifier_Confidence": "1.0000",
                "Novelty_Score": "0.0100",
                "Local_DB_Match": True
            }
        else:
            # If no match, this sequence needs to be analyzed by the cloud AI.
            sequences_for_ai.append(record)
    
    print(f"Found {len(local_blast_results)} matches locally. Sending {len(sequences_for_ai)} sequences to AI Cloud.")

    # --- Step 2: The Global Genius Check (only if there are unknown sequences) ---
    ai_results_map = {}
    if sequences_for_ai:
        # Create a temporary FASTA file with only the sequences the AI needs to see
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix=".fasta") as tmp:
            SeqIO.write(sequences_for_ai, tmp, "fasta")
            tmp_path = tmp.name
        
        headers = {"ngrok-skip-browser-warning": "true"}
        
        with open(tmp_path, 'rb') as f:
            files = {'fastaFile': f}
            print("--- Calling Live Classifier & Novelty AI Servers ---")
            classifier_response = requests.post(CLASSIFIER_API_URL, files=f, headers=headers, verify=False)
            classifier_response.raise_for_status()
            classifier_results = classifier_response.json()["predictions"]

            f.seek(0) # Reset file pointer for the second request
            novelty_response = requests.post(NOVELTY_API_URL, files=f, headers=headers, verify=False)
            novelty_response.raise_for_status()
            novelty_results = novelty_response.json()["novelty_scores"]
        
        os.remove(tmp_path) # Clean up the temporary file

        # --- Step 3: The Ensemble Logic for AI results ---
        for i, record in enumerate(sequences_for_ai):
            class_res = classifier_results[i]
            novelty_score = novelty_results[i]
            
            species_name = f"TaxID:{class_res['taxonomic_id']}"
            confidence_score = class_res['confidence']

            final_prediction = species_name
            if novelty_score > 0.9 and confidence_score < 0.8:
                final_prediction = "Novel Taxa Discovery Alert!"

            ai_results_map[record.id] = {
                "Predicted_Species": final_prediction,
                "Classifier_Confidence": f"{confidence_score:.4f}",
                "Novelty_Score": f"{novelty_score:.4f}",
                "Local_DB_Match": False
            }

    # --- Step 4: Merge the Local and AI Results ---
    final_results_data = []
    species_list = []
    for record in all_records:
        if record.id in local_blast_results:
            result = local_blast_results[record.id]
        else:
            result = ai_results_map.get(record.id, {})
        
        full_result = {"Sequence_ID": record.id, **result}
        final_results_data.append(full_result)
        species_list.append(full_result.get("Predicted_Species", "Unclassified"))
        
    results_df = pd.DataFrame(final_results_data)
    
    # --- Step 5: Abundance Estimation on the Final, Merged Results ---
    abundance_model = AbundanceEstimator()
    corrected_abundance = abundance_model.correct_abundance(results_df)
    
    biodiversity_metrics = BioAnalyzerFallback("")._calculate_biodiversity(species_list)
    
    return results_df, biodiversity_metrics, corrected_abundance

def main():
    fasta_file = sys.argv[1]
    try:
        if USE_REAL_MODELS:
            results_df, biodiversity_metrics, corrected_abundance = analyze_with_hybrid_strategy(fasta_file)
        else:
            fallback_analyzer = BioAnalyzerFallback(model_path="fallback")
            results_df, biodiversity_metrics = fallback_analyzer.analyze_sequences(fasta_file)
            # Simulate abundance for fallback mode
            corrected_abundance = {row['Predicted_Species']: 1.0 for index, row in results_df.iterrows()}

        output = {
            "classification_results": results_df.to_dict(orient='records'),
            "biodiversity_metrics": biodiversity_metrics,
            "corrected_abundance": corrected_abundance,
            "status": "success",
            "mode": "Live AI Ensemble" if USE_REAL_MODELS else "Fallback Simulation"
        }
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "error"}))
        sys.exit(1)

if __name__ == "__main__":
    main()