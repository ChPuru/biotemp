# python_engine/run_phylo_tree.py
import sys
import json
import os
import subprocess
import tempfile
from Bio import AlignIO
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor
from Bio import Phylo

def generate_tree_from_alignment(aln_file):
    """Calculates a tree from a multiple sequence alignment file."""
    with open(aln_file, "r") as aln:
        alignment = AlignIO.read(aln, "clustal")
        calculator = DistanceCalculator('identity')
        dm = calculator.get_distance(alignment)
        constructor = DistanceTreeConstructor()
        tree = constructor.nj(dm) # Neighbor-Joining tree construction
        return tree

def generate_tree(fasta_file: str):
    """
    Generates a phylogenetic tree from a FASTA file using an external aligner
    and returns it in Newick format.
    """
    # Use MAFFT, a modern and fast aligner. It must be installed in the environment.
    # Command: sudo apt-get install mafft
    aligner_cmd = "mafft"
    
    try:
        print("--- Running Multiple Sequence Alignment (MAFFT) ---")
        # Create a temporary file for the alignment output
        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix=".aln") as tmp_aln:
            aln_file_path = tmp_aln.name
        
        # Build and run the command
        cmd = [aligner_cmd, "--auto", "--quiet", fasta_file]
        with open(aln_file_path, "w") as f_out:
            subprocess.run(cmd, stdout=f_out, check=True)

        print("--- Alignment complete. Building tree. ---")
        tree = generate_tree_from_alignment(aln_file_path)
        
        # Convert the tree object to a Newick string
        newick_string = tree.format("newick").strip()
        
        os.remove(aln_file_path) # Clean up

        return {"status": "success", "newick_tree": newick_string}

    except Exception as e:
        print(f"--- MAFFT failed ({e}). This can happen if the tool is not installed. ---")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    fasta_file_path = sys.argv[1]
    results = generate_tree(fasta_file_path)
    print(json.dumps(results))