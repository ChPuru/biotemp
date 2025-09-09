# python_engine/run_quantum.py (LIVE & SECURE VERSION)
import json
import os
import time
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit_ibm_runtime import QiskitRuntimeService

def run_on_real_quantum_hardware():
    """
    Attempts to run a quantum circuit on real IBM Quantum hardware by securely
    reading an API token from an environment variable.
    """
    backend_name = "AerSimulator (Local)" # Default fallback
    backend = AerSimulator(method='statevector')

    try:
        # --- THIS IS THE FIX ---
        # Securely read the token from the environment variables.
        token = os.environ.get("IBM_Q_TOKEN")
        if token:
            service = QiskitRuntimeService(channel="ibm_quantum", token=token)
            backend = service.least_busy(simulator=False, operational=True, min_num_qubits=2)
            backend_name = backend.name
            print(f"--- Found real quantum backend: {backend_name} ---")
        else:
            print("--- No IBM_Q_TOKEN found. Using local AerSimulator. ---")

    except Exception as e:
        print(f"--- WARNING: Could not connect to real quantum hardware ({e}). Using AerSimulator. ---")

    try:
        qc = QuantumCircuit(2, 2)
        qc.h(0)
        qc.cx(0, 1)
        qc.measure([0,1], [0,1])

        # Classical baseline: simulate equivalent probability distribution via numpy
        import numpy as np
        start_classical = time.perf_counter()
        classical_counts = { '00': 0, '11': 0 }
        shots = 1024
        # Bell state yields ~50/50 00 and 11
        samples = np.random.choice(['00','11'], size=shots, p=[0.5, 0.5])
        for s in samples:
            classical_counts[s] += 1
        classical_ms = (time.perf_counter() - start_classical) * 1000

        # Quantum (simulator or hardware)
        start_quantum = time.perf_counter()
        job = backend.run(qc, shots=shots)
        result = job.result()
        counts = result.get_counts(qc)
        quantum_ms = (time.perf_counter() - start_quantum) * 1000

        return {
            "status": "success",
            "message": f"Benchmark completed on '{backend_name}'.",
            "job_id": getattr(job, 'job_id', 'local-job-123'),
            "results": counts,
            "benchmark": {
                "shots": shots,
                "classical_ms": round(classical_ms, 2),
                "quantum_ms": round(quantum_ms, 2),
                "speed_ratio": round((classical_ms/quantum_ms) if quantum_ms > 0 else None, 3)
            }
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    quantum_results = run_on_real_quantum_hardware()
    print(json.dumps(quantum_results))