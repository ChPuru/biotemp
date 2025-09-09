#!/usr/bin/env python3
# python_engine/run_sequence_analysis.py - Lightweight Sequence Analysis Toolkit

import json
import os
from pathlib import Path
import numpy as np
from collections import Counter, defaultdict
from Bio import SeqIO, AlignIO, Phylo
from Bio.Align import MultipleSeqAlignment
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
import warnings
warnings.filterwarnings('ignore')

def run_comprehensive_sequence_analysis(fasta_file_path):
    """
    Run comprehensive sequence analysis using lightweight tools

    Args:
        fasta_file_path: Path to FASTA file with DNA/protein sequences

    Returns:
        Dictionary with comprehensive analysis results
    """

    try:
        print("--- Starting Comprehensive Sequence Analysis ---")

        # Parse sequences
        sequences = list(SeqIO.parse(fasta_file_path, "fasta"))

        if not sequences:
            return {
                "status": "error",
                "error": "No valid sequences found in FASTA file"
            }

        print(f"--- Analyzing {len(sequences)} sequences ---")

        # Basic sequence statistics
        basic_stats = calculate_basic_statistics(sequences)

        # Sequence quality and composition
        quality_analysis = analyze_sequence_quality(sequences)

        # Multiple sequence alignment (if multiple sequences)
        alignment_results = {}
        if len(sequences) > 1:
            alignment_results = perform_multiple_alignment(sequences)

        # Phylogenetic analysis
        phylogeny_results = {}
        if len(sequences) >= 3:
            phylogeny_results = build_phylogenetic_tree(sequences)

        # Motif discovery
        motif_analysis = discover_motifs(sequences)

        # Functional domain prediction
        domain_analysis = predict_domains(sequences)

        return {
            "status": "success",
            "analysis_type": "comprehensive_sequence_analysis",
            "input_file": os.path.basename(fasta_file_path),
            "basic_statistics": basic_stats,
            "quality_analysis": quality_analysis,
            "alignment_results": alignment_results,
            "phylogenetic_analysis": phylogeny_results,
            "motif_discovery": motif_analysis,
            "domain_prediction": domain_analysis,
            "processing_time": "comprehensive",
            "backend": "biopython_lightweight"
        }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Sequence analysis failed: {str(e)}"
        }

def calculate_basic_statistics(sequences):
    """Calculate basic sequence statistics"""
    lengths = [len(seq) for seq in sequences]
    seq_types = []

    for seq in sequences:
        if set(str(seq.seq).upper()) <= set('ATCGN'):
            seq_types.append('DNA')
        elif set(str(seq.seq).upper()) <= set('AUCGN'):
            seq_types.append('RNA')
        else:
            seq_types.append('Protein')

    return {
        "total_sequences": len(sequences),
        "sequence_types": Counter(seq_types),
        "length_statistics": {
            "min": min(lengths),
            "max": max(lengths),
            "mean": round(np.mean(lengths), 1),
            "median": int(np.median(lengths)),
            "total_bp": sum(lengths)
        },
        "sequence_ids": [seq.id for seq in sequences]
    }

def analyze_sequence_quality(sequences):
    """Analyze sequence quality and composition"""
    all_sequences = ''.join(str(seq.seq).upper() for seq in sequences)
    total_bases = len(all_sequences)

    # Nucleotide/amino acid composition
    composition = Counter(all_sequences)

    # GC content (for DNA/RNA)
    gc_bases = composition.get('G', 0) + composition.get('C', 0)
    gc_content = (gc_bases / total_bases * 100) if total_bases > 0 else 0

    # Sequence complexity
    unique_chars = len(set(all_sequences))
    total_chars = len(all_sequences)
    complexity = unique_chars / total_chars if total_chars > 0 else 0

    # Quality scores (mock for demonstration)
    quality_scores = []
    for seq in sequences:
        seq_str = str(seq.seq)
        # Simple quality based on length and composition
        length_score = min(len(seq_str) / 1000, 1) * 20
        complexity_score = complexity * 30
        quality_scores.append(length_score + complexity_score)

    return {
        "nucleotide_composition": dict(composition),
        "gc_content": round(gc_content, 2),
        "sequence_complexity": round(complexity, 4),
        "average_quality_score": round(np.mean(quality_scores), 1),
        "quality_distribution": {
            "high_quality": len([q for q in quality_scores if q > 35]),
            "medium_quality": len([q for q in quality_scores if 25 <= q <= 35]),
            "low_quality": len([q for q in quality_scores if q < 25])
        }
    }

def perform_multiple_alignment(sequences):
    """Perform multiple sequence alignment using lightweight methods"""
    try:
        from Bio.Align.Applications import ClustalOmegaCommandline

        # Create temporary files
        input_file = "temp_sequences.fasta"
        output_file = "temp_alignment.fasta"

        # Write sequences to file
        SeqIO.write(sequences, input_file, "fasta")

        # Try Clustal Omega if available
        try:
            clustalomega_cline = ClustalOmegaCommandline(
                infile=input_file,
                outfile=output_file,
                verbose=True,
                auto=True
            )
            clustalomega_cline()

            # Read alignment
            alignment = AlignIO.read(output_file, "fasta")

        except:
            # Fallback to simple pairwise alignment
            print("ClustalOmega not available, using pairwise alignment")
            alignment = create_simple_alignment(sequences)

        # Calculate conservation scores
        conservation_scores = calculate_conservation(alignment)

        # Clean up
        for f in [input_file, output_file]:
            if os.path.exists(f):
                os.remove(f)

        return {
            "alignment_length": alignment.get_alignment_length(),
            "num_sequences": len(alignment),
            "conservation_scores": conservation_scores,
            "alignment_summary": {
                "most_conserved_positions": sorted(
                    [(i, score) for i, score in enumerate(conservation_scores)],
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
            }
        }

    except Exception as e:
        return {
            "error": f"Alignment failed: {str(e)}",
            "fallback": "simple_alignment"
        }

def create_simple_alignment(sequences):
    """Create simple alignment for demonstration"""
    # This is a simplified alignment for demo purposes
    # In practice, you'd use proper alignment tools

    max_length = max(len(seq) for seq in sequences)
    aligned_sequences = []

    for seq in sequences:
        seq_str = str(seq.seq).ljust(max_length, '-')
        aligned_sequences.append(SeqRecord(
            Seq(seq_str),
            id=seq.id,
            description=seq.description
        ))

    return MultipleSeqAlignment(aligned_sequences)

def calculate_conservation(alignment):
    """Calculate conservation scores for each position"""
    conservation_scores = []

    for i in range(alignment.get_alignment_length()):
        column = alignment[:, i]
        # Remove gaps for conservation calculation
        column_no_gaps = [c for c in column if c != '-']

        if not column_no_gaps:
            conservation_scores.append(0)
            continue

        # Calculate entropy-based conservation
        from collections import Counter
        counts = Counter(column_no_gaps)
        total = len(column_no_gaps)

        entropy = 0
        for count in counts.values():
            p = count / total
            entropy -= p * np.log2(p) if p > 0 else 0

        # Convert to conservation score (higher = more conserved)
        max_entropy = np.log2(len(set(column_no_gaps))) if column_no_gaps else 0
        conservation = 1 - (entropy / max_entropy) if max_entropy > 0 else 1
        conservation_scores.append(round(conservation, 3))

    return conservation_scores

def build_phylogenetic_tree(sequences):
    """Build phylogenetic tree using distance methods"""
    try:
        from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor

        # Create alignment if needed
        if hasattr(sequences[0], 'seq'):
            # Convert SeqRecord to alignment
            alignment = MultipleSeqAlignment(sequences)
        else:
            alignment = sequences

        # Calculate distance matrix
        calculator = DistanceCalculator('identity')
        dm = calculator.get_distance(alignment)

        # Build tree
        constructor = DistanceTreeConstructor()
        tree = constructor.build_tree(dm)

        # Extract tree information
        tree_info = {
            "num_leaves": len(tree.get_terminals()),
            "num_internal_nodes": len(tree.get_nonterminals()),
            "tree_depth": tree.depth(),
            "branch_lengths": [clade.branch_length for clade in tree.find_clades() if clade.branch_length]
        }

        return tree_info

    except Exception as e:
        return {
            "error": f"Phylogenetic analysis failed: {str(e)}",
            "method": "distance_based"
        }

def discover_motifs(sequences):
    """Discover sequence motifs"""
    # Simple motif discovery using frequency analysis
    all_sequences = [str(seq.seq).upper() for seq in sequences]

    # Find common k-mers
    k = 6  # hexamers
    kmer_counts = Counter()

    for seq in all_sequences:
        for i in range(len(seq) - k + 1):
            kmer = seq[i:i+k]
            kmer_counts[kmer] += 1

    # Find most frequent motifs
    top_motifs = kmer_counts.most_common(10)

    # Calculate motif enrichment
    total_kmers = sum(kmer_counts.values())
    motif_enrichment = {}

    for motif, count in top_motifs:
        expected = (4 ** k) / len(kmer_counts)  # Expected under random
        observed = count / total_kmers
        enrichment = observed / expected if expected > 0 else 1
        motif_enrichment[motif] = round(enrichment, 2)

    return {
        "motif_length": k,
        "top_motifs": top_motifs,
        "motif_enrichment": motif_enrichment,
        "total_unique_kmers": len(kmer_counts)
    }

def predict_domains(sequences):
    """Predict functional domains (simplified)"""
    domain_predictions = {}

    for seq in sequences:
        seq_str = str(seq.seq).upper()
        domains = []

        # Simple pattern-based domain prediction
        if 'KRK' in seq_str:
            domains.append({"name": "Nuclear Localization Signal", "position": seq_str.find('KRK')})
        if seq_str.count('C') >= 4:
            domains.append({"name": "Cysteine-rich region", "count": seq_str.count('C')})
        if 'GGG' in seq_str:
            domains.append({"name": "Poly-Glycine motif", "position": seq_str.find('GGG')})
        if seq_str.startswith('M'):
            domains.append({"name": "Methionine start codon", "position": 0})

        domain_predictions[seq.id] = domains

    return {
        "domain_predictions": domain_predictions,
        "total_domains_found": sum(len(domains) for domains in domain_predictions.values()),
        "common_domains": Counter(
            domain["name"] for domains in domain_predictions.values()
            for domain in domains
        ).most_common(5)
    }

def run_sequence_comparison(file_path1, file_path2):
    """Compare two sequence datasets"""
    print("--- Comparing sequence datasets ---")

    result1 = run_comprehensive_sequence_analysis(file_path1)
    result2 = run_comprehensive_sequence_analysis(file_path2)

    if result1["status"] != "success" or result2["status"] != "success":
        return {"status": "error", "error": "Failed to analyze one or both datasets"}

    # Calculate comparison metrics
    comparison = {
        "sequence_count_difference": (
            result1["basic_statistics"]["total_sequences"] -
            result2["basic_statistics"]["total_sequences"]
        ),
        "average_length_difference": (
            result1["basic_statistics"]["length_statistics"]["mean"] -
            result2["basic_statistics"]["length_statistics"]["mean"]
        ),
        "gc_content_difference": (
            result1["quality_analysis"]["gc_content"] -
            result2["quality_analysis"]["gc_content"]
        )
    }

    return {
        "status": "success",
        "analysis_type": "sequence_comparison",
        "datasets": {
            "dataset1": {
                "file": os.path.basename(file_path1),
                "basic_stats": result1["basic_statistics"],
                "quality": result1["quality_analysis"]
            },
            "dataset2": {
                "file": os.path.basename(file_path2),
                "basic_stats": result2["basic_statistics"],
                "quality": result2["quality_analysis"]
            }
        },
        "comparison_metrics": comparison
    }

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "error": "Usage: python run_sequence_analysis.py <fasta_file>"
        }))
        sys.exit(1)

    fasta_file = sys.argv[1]

    if not os.path.exists(fasta_file):
        print(json.dumps({"status": "error", "error": f"FASTA file not found: {fasta_file}"}))
        sys.exit(1)

    results = run_comprehensive_sequence_analysis(fasta_file)
    print(json.dumps(results))