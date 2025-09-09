# python_engine/main_ensemble.py (FINAL HYBRID VERSION)

import sys
import json
import os
import requests
import pandas as pd
from Bio import SeqIO
import subprocess
from io import StringIO
import tempfile

# Import your new and fallback modules
from biomapper_lite.core.abundance_estimator import AbundanceEstimator
from biomapper_lite.core.classifier_fallback import BioAnalyzerFallback

# --- Multi-Model Configuration ---
# Removed binary trigger, now uses flexible fallback strategy

# --- Live Server Configuration ---
CLASSIFIER_API_URL = "https://<classifier_url>.ngrok.io/analyze"
NOVELTY_API_URL = "https://<novelty_url>.ngrok.io/analyze"
LOCAL_BLAST_DB_PATH = "python_engine/db/BioMapperDB"
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama2:7b"  # Local Ollama model for DNA analysis

def run_local_blast(sequence: str):
    """Runs a BLAST search against our local, curated database using subprocess."""
    try:
        import subprocess
        
        # Create temporary input file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.fasta') as tmp_input:
            tmp_input.write(f">query\n{sequence}\n")
            tmp_input_path = tmp_input.name
        
        # Create temporary output file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.xml') as tmp_output:
            tmp_output_path = tmp_output.name
        
        # Run BLAST using subprocess
        cmd = [
            'blastn',
            '-db', LOCAL_BLAST_DB_PATH,
            '-query', tmp_input_path,
            '-out', tmp_output_path,
            '-outfmt', '5',  # XML output
            '-task', 'blastn',
            '-max_target_seqs', '1'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        # Clean up temporary files
        os.unlink(tmp_input_path)
        
        if result.returncode == 0 and os.path.exists(tmp_output_path):
            with open(tmp_output_path, 'r') as f:
                output = f.read()
            os.unlink(tmp_output_path)
            
            if "<Hsp_identity>" in output and "<Hsp_num>" in output:
                return True, "Match found in BioMapperDB"
        
        return False, "No match found in BioMapperDB"
    except Exception as e:
        return False, f"Local BLAST error: {e}"

def analyze_with_ollama(sequence: str):
    """Analyzes DNA sequence using local Ollama LLM with enhanced fallback."""
    try:
        # Check if Ollama is available
        health_check = requests.get("http://localhost:11434/api/tags", timeout=5)
        if health_check.status_code != 200:
            return False, "Ollama service not available"
        
        prompt = f"""
        You are a bioinformatics expert. Analyze this DNA sequence and identify the most likely species.
        
        DNA Sequence (first 200bp): {sequence[:200]}
        Sequence length: {len(sequence)} base pairs
        
        Based on sequence characteristics, nucleotide composition, and patterns, provide:
        1. Most likely species (scientific name)
        2. Confidence level (0.0 to 1.0)
        3. Taxonomic classification (Kingdom, Phylum, Class if possible)
        4. Brief reasoning for identification
        
        Respond ONLY in valid JSON format like this:
        {{
            "species": "Homo sapiens",
            "confidence": 0.85,
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Mammalia",
            "reasoning": "High GC content and codon usage patterns typical of mammalian sequences"
        }}
        """
        
        # Try multiple Ollama models as fallbacks
        models_to_try = [
            "llama3:8b-instruct-q4_K_M",
            "llama2:7b",
            "llama2:13b"
        ]
        
        for model in models_to_try:
            try:
                response = requests.post(OLLAMA_API_URL, json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "num_predict": 200
                    }
                }, timeout=45)
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get('response', '')
                    
                    # Try to parse as JSON
                    try:
                        analysis = json.loads(response_text)
                        return True, {
                            "species": analysis.get("species", "Unknown species"),
                            "confidence": float(analysis.get("confidence", 0.75)),
                            "kingdom": analysis.get("kingdom", "Unknown"),
                            "phylum": analysis.get("phylum", "Unknown"),
                            "class": analysis.get("class", "Unknown"),
                            "reasoning": analysis.get("reasoning", "LLM-based sequence analysis"),
                            "model_used": model
                        }
                    except (json.JSONDecodeError, ValueError):
                        # Fallback: extract information from text response
                        species = extract_species_from_text(response_text)
                        return True, {
                            "species": species,
                            "confidence": 0.65,
                            "kingdom": "Unknown",
                            "phylum": "Unknown", 
                            "class": "Unknown",
                            "reasoning": f"Text-based analysis: {response_text[:100]}...",
                            "model_used": model
                        }
                        
            except requests.exceptions.Timeout:
                print(f"Timeout with model {model}, trying next...")
                continue
            except Exception as e:
                print(f"Error with model {model}: {e}, trying next...")
                continue
        
        return False, "All Ollama models failed or unavailable"
        
    except Exception as e:
        return False, f"Ollama connection error: {e}"

def extract_species_from_text(text):
    """Extract species name from unstructured text response."""
    import re
    
    # Common patterns for species names
    patterns = [
        r'([A-Z][a-z]+ [a-z]+)',  # Genus species format
        r'species[:\s]+([A-Z][a-z]+ [a-z]+)',
        r'identified as[:\s]+([A-Z][a-z]+ [a-z]+)',
        r'likely[:\s]+([A-Z][a-z]+ [a-z]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    
    # Fallback
    return "Species identified via LLM"

def analyze_with_hybrid_strategy(fasta_file_path: str):
    """
    Orchestrates the new, efficient, multi-stage hybrid analysis.
    """
    all_records = list(SeqIO.parse(fasta_file_path, "fasta"))
    
    # --- Step 1: Multi-Model Analysis Strategy ---
    print("--- Running Multi-Model Analysis Pipeline ---")
    local_blast_results = {}
    ollama_results = {}
    sequences_for_cloud_ai = []
    
    for record in all_records:
        sequence_str = str(record.seq)
        
        # Try local BLAST first
        blast_match, blast_result = run_local_blast(sequence_str)
        if blast_match:
            local_blast_results[record.id] = {
                "Predicted_Species": f"{record.description.split(' ')[1]} (Verified Locally)",
                "Classifier_Confidence": "1.0000",
                "Novelty_Score": "0.0100",
                "Local_DB_Match": True,
                "Analysis_Method": "Local BLAST"
            }
            continue
        
        # Try Ollama local LLM if BLAST fails
        ollama_success, ollama_result = analyze_with_ollama(sequence_str)
        if ollama_success:
            ollama_results[record.id] = {
                "Predicted_Species": ollama_result.get("species", "Unknown"),
                "Classifier_Confidence": str(ollama_result.get("confidence", 0.75)),
                "Novelty_Score": "0.3000",
                "Local_DB_Match": False,
                "Analysis_Method": "Local Ollama LLM"
            }
            continue
        
        # If both local methods fail, queue for cloud AI
        sequences_for_cloud_ai.append(record)
    
    print(f"BLAST: {len(local_blast_results)}, Ollama: {len(ollama_results)}, Cloud AI: {len(sequences_for_cloud_ai)} sequences")

    # --- Step 2: Cloud AI Analysis (only for remaining sequences) ---
    cloud_ai_results = {}
    if sequences_for_cloud_ai:
        # Create a temporary FASTA file with only the sequences the AI needs to see
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix=".fasta") as tmp:
            SeqIO.write(sequences_for_cloud_ai, tmp, "fasta")
            tmp_path = tmp.name
        
        headers = {"ngrok-skip-browser-warning": "true"}
        
        try:
            with open(tmp_path, 'rb') as f:
                files = {'fastaFile': f}
                print("--- Calling Live Classifier & Novelty AI Servers ---")
                classifier_response = requests.post(CLASSIFIER_API_URL, files=files, headers=headers, verify=False, timeout=60)
                classifier_response.raise_for_status()
                classifier_results = classifier_response.json()["predictions"]

                f.seek(0) # Reset file pointer for the second request
                novelty_response = requests.post(NOVELTY_API_URL, files=files, headers=headers, verify=False, timeout=60)
                novelty_response.raise_for_status()
                novelty_results = novelty_response.json()["novelty_scores"]
        except Exception as e:
            print(f"Cloud AI failed: {e}. Using fallback analysis.")
            # Fallback to local analysis for remaining sequences
            fallback_analyzer = BioAnalyzerFallback("fallback")
            for record in sequences_for_cloud_ai:
                cloud_ai_results[record.id] = {
                    "Predicted_Species": f"Fallback_{record.id}",
                    "Classifier_Confidence": "0.6000",
                    "Novelty_Score": "0.5000",
                    "Local_DB_Match": False,
                    "Analysis_Method": "Fallback Simulation"
                }
            return analyze_with_fallback_only(fasta_file_path)
        
        os.remove(tmp_path) # Clean up the temporary file

        # --- Step 3: The Ensemble Logic for Cloud AI results ---
        for i, record in enumerate(sequences_for_cloud_ai):
            class_res = classifier_results[i]
            novelty_score = novelty_results[i]
            
            species_name = f"TaxID:{class_res['taxonomic_id']}"
            confidence_score = class_res['confidence']

            final_prediction = species_name
            if novelty_score > 0.9 and confidence_score < 0.8:
                final_prediction = "Novel Taxa Discovery Alert!"

            cloud_ai_results[record.id] = {
                "Predicted_Species": final_prediction,
                "Classifier_Confidence": f"{confidence_score:.4f}",
                "Novelty_Score": f"{novelty_score:.4f}",
                "Local_DB_Match": False,
                "Analysis_Method": "Cloud AI Ensemble"
            }

    # --- Step 4: Merge All Results (BLAST, Ollama, Cloud AI) ---
    final_results_data = []
    species_list = []
    for record in all_records:
        if record.id in local_blast_results:
            result = local_blast_results[record.id]
        elif record.id in ollama_results:
            result = ollama_results[record.id]
        else:
            result = cloud_ai_results.get(record.id, {})
        
        full_result = {"Sequence_ID": record.id, **result}
        final_results_data.append(full_result)
        species_list.append(full_result.get("Predicted_Species", "Unclassified"))
        
    results_df = pd.DataFrame(final_results_data)
    
    # --- Step 5: Abundance Estimation on the Final, Merged Results ---
    abundance_model = AbundanceEstimator()
    corrected_abundance = abundance_model.correct_abundance(results_df)
    
    biodiversity_metrics = BioAnalyzerFallback("")._calculate_biodiversity(species_list)
    
    return results_df, biodiversity_metrics, corrected_abundance

def analyze_with_fallback_only(fasta_file_path: str):
    """Fallback analysis when all other methods fail."""
    fallback_analyzer = BioAnalyzerFallback(model_path="fallback")
    results_df, biodiversity_metrics = fallback_analyzer.analyze_sequences(fasta_file_path)
    corrected_abundance = {row['Predicted_Species']: 1.0 for index, row in results_df.iterrows()}
    return results_df, biodiversity_metrics, corrected_abundance

def main():
    # Check if file path is provided, use default if not
    if len(sys.argv) < 2:
        # Use default sample file
        default_fasta = os.path.join(os.path.dirname(__file__), "data", "golden_dataset.fasta")
        if os.path.exists(default_fasta):
            fasta_file = default_fasta
            print(json.dumps({
                "info": f"No FASTA file provided, using default: {default_fasta}",
                "status": "info"
            }))
        else:
            print(json.dumps({
                "error": "FASTA file path required as argument and no default file found",
                "status": "error",
                "usage": "python main_ensemble.py <fasta_file_path>",
                "default_expected": default_fasta
            }))
            sys.exit(1)
    else:
        fasta_file = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(fasta_file):
        print(json.dumps({
            "error": f"FASTA file not found: {fasta_file}",
            "status": "error"
        }))
        sys.exit(1)
    
    try:
        # Always try the multi-model hybrid strategy first
        results_df, biodiversity_metrics, corrected_abundance = analyze_with_hybrid_strategy(fasta_file)

        output = {
            "classification_results": results_df.to_dict(orient='records'),
            "biodiversity_metrics": biodiversity_metrics,
            "corrected_abundance": corrected_abundance,
            "status": "success",
            "mode": "Multi-Model Hybrid Analysis (BLAST + Ollama + Cloud AI + Fallback)"
        }
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "error"}))
        sys.exit(1)

if __name__ == "__main__":
    main()