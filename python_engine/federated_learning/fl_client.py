# python_engine/federated_learning/fl_client.py
import requests
import time
import random
import sys

SERVER_URL = "http://localhost:8890"

def run_client(client_id):
    print(f"[{client_id}] Starting...")
    
    # 1. Register with the server
    requests.post(f"{SERVER_URL}/register", json={"client_id": client_id})
    print(f"[{client_id}] Registered with server.")
    
    # 2. Get the global model
    model_info = requests.get(f"{SERVER_URL}/get_model").json()
    print(f"[{client_id}] Downloaded global model v{model_info['version']:.1f}.")
    
    # 3. Simulate local training
    print(f"[{client_id}] Starting local training...")
    time.sleep(random.randint(5, 10))
    accuracy_improvement = random.uniform(0.5, 2.0)
    print(f"[{client_id}] Local training complete. Accuracy improved by {accuracy_improvement:.2f}%.")
    
    # 4. Submit the update
    requests.post(f"{SERVER_URL}/submit_update", json={
        "client_id": client_id,
        "accuracy_improvement": accuracy_improvement
    })
    print(f"[{client_id}] Submitted update to server. Shutting down.")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python fl_client.py <client_id>")
        sys.exit(1)
    client_id = sys.argv[1]
    run_client(client_id)