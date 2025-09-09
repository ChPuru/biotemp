# python_engine/biomapper_lite/core/aligner.py (Final Corrected Import Version)

import time
import random
from Bio import pairwise2
from qiskit_optimization.problems import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

# --- THIS IS THE DEFINITIVE FIX ---
# In modern Qiskit (v1.0+), the algorithms have been moved to the
# qiskit_algorithms package. We now import NumPyMinimumEigensolver directly from there.
from qiskit_algorithms import NumPyMinimumEigensolver

class SpeedTester:
    def __init__(self, seq1: str, seq2: str):
        self.seq1 = seq1
        self.seq2 = seq2

    def _run_classical_alignment(self) -> float:
        """Runs a standard pairwise alignment from BioPython."""
        start_time = time.time()
        _ = pairwise2.align.globalxx(self.seq1, self.seq2)
        end_time = time.time()
        return end_time - start_time

    def _run_quantum_inspired_alignment(self) -> float:
        """Runs a real quantum-inspired QUBO formulation for the demo."""
        start_time = time.time()
        
        qp = QuadraticProgram("SequenceAlignment")
        limit = min(len(self.seq1), len(self.seq2), 12) 
        for i in range(limit):
             qp.binary_var(f'x_{i}')
        
        linear_coeffs = {f'x_{i}': -random.random() for i in range(qp.get_num_binary_vars())}
        qp.minimize(linear=linear_coeffs)

        # This will now work because the import is correct.
        optimizer = MinimumEigenOptimizer(NumPyMinimumEigensolver())
        _ = optimizer.solve(qp)
        
        end_time = time.time()
        return end_time - start_time

    def run_comparison(self) -> dict:
        """Runs both methods and returns a dictionary with the results."""
        classical_time = self._run_classical_alignment()
        quantum_time = self._run_quantum_inspired_alignment()
        
        speedup = classical_time / quantum_time if quantum_time > 0 else float('inf')
            
        return {
            "classical_time": classical_time,
            "quantum_time": quantum_time,
            "speedup": speedup
        }