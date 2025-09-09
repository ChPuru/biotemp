#!/usr/bin/env python3
# python_engine/run_qiime2.py - QIIME2 Integration for Microbiome Analysis

import json
import os
import subprocess
import tempfile
import shutil
from pathlib import Path
import pandas as pd

def run_qiime2_microbiome_analysis(fasta_file_path, metadata_file=None):
    """
    Run comprehensive QIIME2 microbiome analysis pipeline

    Args:
        fasta_file_path: Path to FASTA file with DNA sequences
        metadata_file: Optional path to sample metadata TSV file

    Returns:
        Dictionary with analysis results
    """

    # Create temporary working directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        try:
            # Step 1: Import sequences into QIIME2 artifact
            print("--- Step 1: Importing sequences ---")
            imported_seqs_path = temp_path / "imported_seqs.qza"

            cmd_import = [
                "qiime", "tools", "import",
                "--type", "SampleData[SequencesWithQuality]",
                "--input-path", fasta_file_path,
                "--output-path", str(imported_seqs_path)
            ]

            if metadata_file:
                cmd_import.extend(["--input-format", "SingleEndFastqManifestPhred33"])

            result = subprocess.run(cmd_import, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {
                    "status": "error",
                    "error": f"QIIME2 import failed: {result.stderr}",
                    "step": "import"
                }

            # Step 2: Quality control and filtering
            print("--- Step 2: Quality filtering ---")
            filtered_seqs_path = temp_path / "filtered_seqs.qza"

            cmd_filter = [
                "qiime", "quality-filter", "q-score",
                "--i-demux", str(imported_seqs_path),
                "--o-filtered-sequences", str(filtered_seqs_path),
                "--o-filter-stats", str(temp_path / "filter_stats.qza")
            ]

            result = subprocess.run(cmd_filter, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {
                    "status": "error",
                    "error": f"Quality filtering failed: {result.stderr}",
                    "step": "filtering"
                }

            # Step 3: Dereplication
            print("--- Step 3: Dereplication ---")
            derep_seqs_path = temp_path / "derep_seqs.qza"
            derep_table_path = temp_path / "derep_table.qza"

            cmd_derep = [
                "qiime", "vsearch", "dereplicate-sequences",
                "--i-sequences", str(filtered_seqs_path),
                "--o-dereplicated-sequences", str(derep_seqs_path),
                "--o-dereplicated-table", str(derep_table_path)
            ]

            result = subprocess.run(cmd_derep, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {
                    "status": "error",
                    "error": f"Dereplication failed: {result.stderr}",
                    "step": "dereplication"
                }

            # Step 4: Clustering (OTU picking)
            print("--- Step 4: OTU clustering ---")
            otu_seqs_path = temp_path / "otu_seqs.qza"
            otu_table_path = temp_path / "otu_table.qza"

            cmd_cluster = [
                "qiime", "vsearch", "cluster-features-de-novo",
                "--i-sequences", str(derep_seqs_path),
                "--i-table", str(derep_table_path),
                "--p-perc-identity", "0.97",
                "--o-clustered-sequences", str(otu_seqs_path),
                "--o-clustered-table", str(otu_table_path)
            ]

            result = subprocess.run(cmd_cluster, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {
                    "status": "error",
                    "error": f"OTU clustering failed: {result.stderr}",
                    "step": "clustering"
                }

            # Step 5: Taxonomy assignment
            print("--- Step 5: Taxonomy assignment ---")
            taxonomy_path = temp_path / "taxonomy.qza"

            # Use pre-trained classifier (would need to be downloaded separately)
            classifier_path = "/path/to/gg-13-8-99-515-806-nb-classifier.qza"  # Placeholder

            if os.path.exists(classifier_path):
                cmd_taxonomy = [
                    "qiime", "feature-classifier", "classify-sklearn",
                    "--i-classifier", classifier_path,
                    "--i-reads", str(otu_seqs_path),
                    "--o-classification", str(taxonomy_path)
                ]

                result = subprocess.run(cmd_taxonomy, capture_output=True, text=True, cwd=temp_dir)

                if result.returncode != 0:
                    print(f"Taxonomy assignment failed: {result.stderr}")
                    taxonomy_available = False
                else:
                    taxonomy_available = True
            else:
                print("Pre-trained classifier not found, skipping taxonomy assignment")
                taxonomy_available = False

            # Step 6: Diversity analysis
            print("--- Step 6: Diversity analysis ---")
            diversity_results = {}

            if metadata_file and os.path.exists(metadata_file):
                # Core diversity metrics
                diversity_dir = temp_path / "diversity"
                diversity_dir.mkdir(exist_ok=True)

                cmd_diversity = [
                    "qiime", "diversity", "core-metrics",
                    "--i-table", str(otu_table_path),
                    "--p-sampling-depth", "1000",
                    "--m-metadata-file", metadata_file,
                    "--output-dir", str(diversity_dir)
                ]

                result = subprocess.run(cmd_diversity, capture_output=True, text=True, cwd=temp_dir)

                if result.returncode == 0:
                    diversity_results = {
                        "alpha_diversity": "calculated",
                        "beta_diversity": "calculated",
                        "sampling_depth": 1000
                    }
                else:
                    print(f"Diversity analysis failed: {result.stderr}")

            # Step 7: Export results
            print("--- Step 7: Exporting results ---")
            export_dir = temp_path / "export"
            export_dir.mkdir(exist_ok=True)

            # Export OTU table
            cmd_export_table = [
                "qiime", "tools", "export",
                "--input-path", str(otu_table_path),
                "--output-path", str(export_dir / "otu_table")
            ]

            subprocess.run(cmd_export_table, capture_output=True, text=True, cwd=temp_dir)

            # Export sequences
            cmd_export_seqs = [
                "qiime", "tools", "export",
                "--input-path", str(otu_seqs_path),
                "--output-path", str(export_dir / "otu_sequences")
            ]

            subprocess.run(cmd_export_seqs, capture_output=True, text=True, cwd=temp_dir)

            # Read exported results
            otu_table_file = export_dir / "otu_table" / "feature-table.biom"
            sequences_file = export_dir / "otu_sequences" / "dna-sequences.fasta"

            otu_count = 0
            if otu_table_file.exists():
                # Count OTUs (simplified)
                otu_count = len(list(export_dir.glob("otu_table/**/*")))

            sequence_count = 0
            if sequences_file.exists():
                with open(sequences_file, 'r') as f:
                    sequence_count = f.read().count('>')

            # Prepare final results
            results = {
                "status": "success",
                "analysis_type": "qiime2_microbiome_analysis",
                "input_file": os.path.basename(fasta_file_path),
                "pipeline_steps": [
                    "sequence_import",
                    "quality_filtering",
                    "dereplication",
                    "otu_clustering",
                    "taxonomy_assignment" if taxonomy_available else None,
                    "diversity_analysis" if diversity_results else None
                ],
                "results": {
                    "total_sequences": sequence_count,
                    "otu_count": otu_count,
                    "taxonomy_available": taxonomy_available,
                    "diversity_metrics": diversity_results
                },
                "files_generated": [
                    "filtered_sequences.qza",
                    "dereplicated_sequences.qza",
                    "otu_table.qza",
                    "otu_sequences.qza"
                ]
            }

            # Remove None values from pipeline steps
            results["pipeline_steps"] = [step for step in results["pipeline_steps"] if step is not None]

            return results

        except Exception as e:
            return {
                "status": "error",
                "error": f"QIIME2 analysis failed: {str(e)}",
                "step": "general"
            }

def run_qiime2_diversity_analysis(table_path, metadata_path):
    """Run QIIME2 diversity analysis on existing feature table"""

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        try:
            # Import feature table
            imported_table_path = temp_path / "imported_table.qza"

            cmd_import = [
                "qiime", "tools", "import",
                "--type", "FeatureTable[Frequency]",
                "--input-path", table_path,
                "--output-path", str(imported_table_path)
            ]

            result = subprocess.run(cmd_import, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {"status": "error", "error": f"Table import failed: {result.stderr}"}

            # Run diversity analysis
            diversity_dir = temp_path / "diversity"

            cmd_diversity = [
                "qiime", "diversity", "core-metrics",
                "--i-table", str(imported_table_path),
                "--p-sampling-depth", "1000",
                "--m-metadata-file", metadata_path,
                "--output-dir", str(diversity_dir)
            ]

            result = subprocess.run(cmd_diversity, capture_output=True, text=True, cwd=temp_dir)

            if result.returncode != 0:
                return {"status": "error", "error": f"Diversity analysis failed: {result.stderr}"}

            return {
                "status": "success",
                "analysis_type": "qiime2_diversity_only",
                "diversity_metrics": {
                    "alpha_diversity": "calculated",
                    "beta_diversity": "calculated",
                    "sampling_depth": 1000
                }
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "Usage: python run_qiime2.py <fasta_file> [metadata_file]"}))
        sys.exit(1)

    fasta_file = sys.argv[1]
    metadata_file = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(fasta_file):
        print(json.dumps({"status": "error", "error": f"FASTA file not found: {fasta_file}"}))
        sys.exit(1)

    results = run_qiime2_microbiome_analysis(fasta_file, metadata_file)
    print(json.dumps(results))