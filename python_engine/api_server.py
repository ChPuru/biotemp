# python_engine/api_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from biomapper_lite.core.classifier import BioAnalyzer

# --- Load the AI Models ONCE at startup ---
print("--- Initializing BioMapper AI Engine ---")
CLASSIFIER_MODEL = 'InstaDeepAI/nucleotide-transformer-2.5b-multi-species'
NOVELTY_MODEL_SIMULATED = 'EleutherAI/gpt-neo-125M' # Placeholder
analyzer = BioAnalyzer(
    classifier_path=CLASSIFIER_MODEL,
    novelty_model_path=NOVELTY_MODEL_SIMULATED
)
print("--- AI Engine Ready ---")

# --- Create the Flask App ---
app = Flask(__name__)
CORS(app) # Enable cross-origin requests

@app.route('/analyze', methods=['POST'])
def analyze_endpoint():
    if 'fastaFile' not in request.files:
        return jsonify({"error": "No FASTA file provided."}), 400

    file = request.files['fastaFile']
    
    # Save the file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".fasta") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Run the analysis
        results_df, biodiversity_metrics = analyzer.analyze_sequences(tmp_path)
        
        # Prepare the final JSON output
        output = {
            "classification_results": results_df.to_dict(orient='records'),
            "biodiversity_metrics": biodiversity_metrics,
            "status": "success"
        }
        return jsonify(output)
        
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

if __name__ == '__main__':
    # Run the app on port 8888, accessible from anywhere
    app.run(host='0.0.0.0', port=8888)