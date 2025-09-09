# python_engine/run_xai.py
import sys
import json
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from captum.attr import LayerIntegratedGradients

def generate_xai_attributions(sequence: str, model_path: str):
    try:
        # For a live demo, the model must be downloaded/cached on the Kaggle machine
        tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        model = AutoModelForSequenceClassification.from_pretrained(model_path, trust_remote_code=True)
        model.eval()

        inputs = tokenizer(sequence, return_tensors="pt")
        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]
        
        # Use LayerIntegratedGradients for Transformer models
        lig = LayerIntegratedGradients(model, model.bert.embeddings)
        baseline = torch.zeros_like(input_ids)
        baseline.fill_(tokenizer.pad_token_id)

        # Generate real attributions
        attributions = lig.attribute(inputs=input_ids, baselines=baseline, additional_forward_args=(attention_mask,))
        attributions = attributions.sum(dim=-1).squeeze(0)
        attributions = attributions / torch.norm(attributions)
        
        tokens = tokenizer.convert_ids_to_tokens(input_ids[0])
        
        return [{"token": token.replace(' ', ''), "attribution": f"{attr.item():.4f}"} for token, attr in zip(tokens, attributions)]
    except Exception as e:
        # Provide a meaningful error if Captum fails
        return [{"token": f"XAI_Error: {e}", "attribution": "0.0"}]

if __name__ == "__main__":
    sequence_to_explain = sys.argv[1]
    # The model path is now passed as an argument for flexibility
    model_path_for_xai = sys.argv[2]
    try:
        results = generate_xai_attributions(sequence_to_explain, model_path_for_xai)
        print(json.dumps({"status": "success", "attributions": results}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))