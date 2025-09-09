# python_engine/run_aligner.py

import json
import sys
from biomapper_lite.core.aligner import SpeedTester

def main():
    """
    This script is dedicated to running the speed comparison.
    It is called by the backend to demonstrate the quantum advantage.
    """
    try:
        # Use representative sequences for the demo
        seq1 = "AGCT" * 100
        seq2 = "AGCT" * 98 + "GGTT"

        tester = SpeedTester(seq1, seq2)
        results = tester.run_comparison()

        output = {
            "status": "success",
            "results": results
        }
        print(json.dumps(output))

    except Exception as e:
        error_output = {
            "status": "error",
            "error": f"An error occurred in the aligner script: {str(e)}"
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == "__main__":
    main()