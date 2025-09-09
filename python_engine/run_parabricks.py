#!/usr/bin/env python3
"""
Parabricks GPU-Accelerated Genomics Pipeline Integration
Provides GPU-accelerated variant calling, RNA-seq analysis, and deep learning workflows
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParabricksService:
    """Service for running NVIDIA Parabricks GPU-accelerated genomics pipelines"""

    def __init__(self):
        self.parabricks_path = self.find_parabricks_installation()
        self.gpu_available = self.check_gpu_availability()
        self.conda_env = 'parabricks'  # Default conda environment name

        # Available Parabricks tools
        self.tools = {
            'deepvariant': {
                'name': 'DeepVariant',
                'description': 'GPU-accelerated variant calling using deep learning',
                'gpu_required': True,
                'typical_speedup': '10-50x',
                'memory_gb': 16,
                'command': 'pbrun deepvariant'
            },
            'fq2bam': {
                'name': 'FQ2BAM',
                'description': 'Fastq to BAM conversion with GPU acceleration',
                'gpu_required': True,
                'typical_speedup': '5-20x',
                'memory_gb': 8,
                'command': 'pbrun fq2bam'
            },
            'haplotypecaller': {
                'name': 'HaplotypeCaller',
                'description': 'GPU-accelerated germline variant calling',
                'gpu_required': True,
                'typical_speedup': '8-30x',
                'memory_gb': 12,
                'command': 'pbrun haplotypecaller'
            },
            'mutectcaller': {
                'name': 'Mutect2',
                'description': 'GPU-accelerated somatic variant calling',
                'gpu_required': True,
                'typical_speedup': '6-25x',
                'memory_gb': 16,
                'command': 'pbrun mutectcaller'
            },
            'rnaseq': {
                'name': 'RNA-seq Pipeline',
                'description': 'Complete GPU-accelerated RNA-seq analysis',
                'gpu_required': True,
                'typical_speedup': '3-15x',
                'memory_gb': 24,
                'command': 'pbrun rnaseq'
            },
            'methylation': {
                'name': 'Methylation Analysis',
                'description': 'GPU-accelerated methylation calling',
                'gpu_required': True,
                'typical_speedup': '4-12x',
                'memory_gb': 20,
                'command': 'pbrun methylation'
            }
        }

    def find_parabricks_installation(self) -> Optional[str]:
        """Find Parabricks installation path"""
        possible_paths = [
            '/opt/parabricks',
            '/usr/local/parabricks',
            '/home/anaconda3/envs/parabricks/bin',
            '/miniconda3/envs/parabricks/bin'
        ]

        for path in possible_paths:
            if os.path.exists(path):
                pbrun_path = os.path.join(path, 'pbrun')
                if os.path.exists(pbrun_path):
                    return path

        # Check if pbrun is in PATH
        try:
            result = subprocess.run(['which', 'pbrun'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return os.path.dirname(result.stdout.strip())
        except:
            pass

        return None

    def check_gpu_availability(self) -> Dict:
        """Check GPU availability and specifications"""
        try:
            result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total,memory.free,driver_version',
                                   '--format=csv,noheader,nounits'],
                                  capture_output=True, text=True)

            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                gpus = []
                for line in lines:
                    parts = [x.strip() for x in line.split(',')]
                    if len(parts) >= 4:
                        gpus.append({
                            'name': parts[0],
                            'total_memory_mb': int(parts[1]),
                            'free_memory_mb': int(parts[2]),
                            'driver_version': parts[3]
                        })

                return {
                    'available': True,
                    'count': len(gpus),
                    'gpus': gpus,
                    'total_memory_mb': sum(gpu['total_memory_mb'] for gpu in gpus)
                }
        except:
            pass

        return {
            'available': False,
            'count': 0,
            'gpus': [],
            'error': 'GPU not available or nvidia-smi not found'
        }

    def check_parabricks_status(self) -> Dict:
        """Check Parabricks installation and GPU status"""
        gpu_info = self.check_gpu_availability()

        status = {
            'parabricks_installed': self.parabricks_path is not None,
            'parabricks_path': self.parabricks_path,
            'gpu_available': gpu_info['available'],
            'gpu_count': gpu_info['count'],
            'total_gpu_memory_mb': gpu_info.get('total_memory_mb', 0),
            'tools_available': list(self.tools.keys()),
            'conda_environment': self.conda_env
        }

        # Test Parabricks functionality
        if status['parabricks_installed'] and status['gpu_available']:
            status['functionality_test'] = self.test_parabricks_functionality()
        else:
            status['functionality_test'] = {
                'passed': False,
                'error': 'Parabricks or GPU not available'
            }

        return status

    def test_parabricks_functionality(self) -> Dict:
        """Test basic Parabricks functionality"""
        try:
            # Test pbrun command availability
            cmd = f"{self.parabricks_path}/pbrun --help"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)

            return {
                'passed': result.returncode == 0,
                'version_info': self.extract_version_info(result.stdout),
                'error': result.stderr if result.returncode != 0 else None
            }
        except Exception as e:
            return {
                'passed': False,
                'error': str(e)
            }

    def extract_version_info(self, output: str) -> Dict:
        """Extract version information from Parabricks output"""
        version_info = {}
        lines = output.split('\n')

        for line in lines:
            if 'version' in line.lower():
                version_info['version'] = line.strip()
            elif 'build' in line.lower():
                version_info['build'] = line.strip()

        return version_info

    def run_deepvariant_pipeline(self, input_bam: str, reference: str, output_dir: str,
                               options: Dict = {}) -> Dict:
        """Run GPU-accelerated DeepVariant pipeline"""
        try:
            os.makedirs(output_dir, exist_ok=True)

            cmd = [
                f"{self.parabricks_path}/pbrun",
                "deepvariant",
                "--in-bam", input_bam,
                "--ref", reference,
                "--out-variants", f"{output_dir}/variants.vcf",
                "--num-gpus", str(options.get('num_gpus', 1)),
                "--gpu-memory", str(options.get('gpu_memory', 16))
            ]

            # Add optional parameters
            if options.get('regions'):
                cmd.extend(["--regions", options['regions']])
            if options.get('threads'):
                cmd.extend(["--num-threads", str(options['threads'])])

            logger.info(f"Running DeepVariant: {' '.join(cmd)}")

            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            end_time = time.time()

            if result.returncode == 0:
                # Parse output for metrics
                metrics = self.parse_deepvariant_output(result.stdout, output_dir)

                return {
                    'status': 'success',
                    'tool': 'deepvariant',
                    'runtime_seconds': end_time - start_time,
                    'output_files': self.list_output_files(output_dir),
                    'metrics': metrics,
                    'gpu_accelerated': True,
                    'command': ' '.join(cmd)
                }
            else:
                return {
                    'status': 'error',
                    'tool': 'deepvariant',
                    'error': result.stderr,
                    'command': ' '.join(cmd)
                }

        except Exception as e:
            logger.error(f"DeepVariant pipeline error: {str(e)}")
            return {
                'status': 'error',
                'tool': 'deepvariant',
                'error': str(e)
            }

    def run_fq2bam_pipeline(self, input_fastq1: str, input_fastq2: str, reference: str,
                          output_dir: str, options: Dict = {}) -> Dict:
        """Run GPU-accelerated FQ2BAM pipeline"""
        try:
            os.makedirs(output_dir, exist_ok=True)

            cmd = [
                f"{self.parabricks_path}/pbrun",
                "fq2bam",
                "--in-fq", input_fastq1, input_fastq2,
                "--ref", reference,
                "--out-bam", f"{output_dir}/output.bam",
                "--out-recal-file", f"{output_dir}/recal.txt",
                "--num-gpus", str(options.get('num_gpus', 1))
            ]

            # Add optional parameters
            if options.get('known-sites'):
                cmd.extend(["--knownSites", options['known-sites']])
            if options.get('threads'):
                cmd.extend(["--num-threads", str(options['threads'])])

            logger.info(f"Running FQ2BAM: {' '.join(cmd)}")

            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            end_time = time.time()

            if result.returncode == 0:
                return {
                    'status': 'success',
                    'tool': 'fq2bam',
                    'runtime_seconds': end_time - start_time,
                    'output_files': self.list_output_files(output_dir),
                    'gpu_accelerated': True,
                    'command': ' '.join(cmd)
                }
            else:
                return {
                    'status': 'error',
                    'tool': 'fq2bam',
                    'error': result.stderr,
                    'command': ' '.join(cmd)
                }

        except Exception as e:
            logger.error(f"FQ2BAM pipeline error: {str(e)}")
            return {
                'status': 'error',
                'tool': 'fq2bam',
                'error': str(e)
            }

    def run_rnaseq_pipeline(self, input_fastq1: str, input_fastq2: str, reference: str,
                          annotation: str, output_dir: str, options: Dict = {}) -> Dict:
        """Run GPU-accelerated RNA-seq pipeline"""
        try:
            os.makedirs(output_dir, exist_ok=True)

            cmd = [
                f"{self.parabricks_path}/pbrun",
                "rnaseq",
                "--in-fq", input_fastq1, input_fastq2,
                "--ref", reference,
                "--annotation-file", annotation,
                "--out-dir", output_dir,
                "--num-gpus", str(options.get('num_gpus', 1))
            ]

            # Add optional parameters
            if options.get('threads'):
                cmd.extend(["--num-threads", str(options['threads'])])

            logger.info(f"Running RNA-seq: {' '.join(cmd)}")

            start_time = time.time()
            result = subprocess.run(cmd, capture_output=True, text=True)
            end_time = time.time()

            if result.returncode == 0:
                return {
                    'status': 'success',
                    'tool': 'rnaseq',
                    'runtime_seconds': end_time - start_time,
                    'output_files': self.list_output_files(output_dir),
                    'gpu_accelerated': True,
                    'command': ' '.join(cmd)
                }
            else:
                return {
                    'status': 'error',
                    'tool': 'rnaseq',
                    'error': result.stderr,
                    'command': ' '.join(cmd)
                }

        except Exception as e:
            logger.error(f"RNA-seq pipeline error: {str(e)}")
            return {
                'status': 'error',
                'tool': 'rnaseq',
                'error': str(e)
            }

    def parse_deepvariant_output(self, output: str, output_dir: str) -> Dict:
        """Parse DeepVariant output for metrics"""
        metrics = {}

        try:
            # Read VCF file to count variants
            vcf_file = f"{output_dir}/variants.vcf"
            if os.path.exists(vcf_file):
                variant_count = 0
                with open(vcf_file, 'r') as f:
                    for line in f:
                        if not line.startswith('#'):
                            variant_count += 1

                metrics['total_variants'] = variant_count

            # Parse performance metrics from output
            lines = output.split('\n')
            for line in lines:
                if 'variants called' in line.lower():
                    # Extract variant calling metrics
                    pass
                elif 'runtime' in line.lower():
                    # Extract timing information
                    pass

        except Exception as e:
            logger.warning(f"Could not parse DeepVariant output: {str(e)}")

        return metrics

    def list_output_files(self, output_dir: str) -> List[str]:
        """List all output files in directory"""
        if not os.path.exists(output_dir):
            return []

        files = []
        for root, dirs, filenames in os.walk(output_dir):
            for filename in filenames:
                files.append(os.path.join(root, filename))

        return files

    def get_system_resources(self) -> Dict:
        """Get current system resource usage"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_used_gb': psutil.virtual_memory().used / (1024**3),
            'memory_total_gb': psutil.virtual_memory().total / (1024**3),
            'gpu_info': self.check_gpu_availability()
        }

    def benchmark_performance(self, tool: str, input_files: Dict, iterations: int = 3) -> Dict:
        """Benchmark Parabricks tool performance"""
        results = []

        for i in range(iterations):
            logger.info(f"Benchmark iteration {i+1}/{iterations} for {tool}")

            start_resources = self.get_system_resources()
            start_time = time.time()

            # Run the tool
            if tool == 'deepvariant':
                result = self.run_deepvariant_pipeline(
                    input_files['bam'], input_files['reference'], f"/tmp/benchmark_{i}"
                )
            elif tool == 'fq2bam':
                result = self.run_fq2bam_pipeline(
                    input_files['fastq1'], input_files['fastq2'],
                    input_files['reference'], f"/tmp/benchmark_{i}"
                )
            else:
                result = {'status': 'error', 'error': f'Unsupported tool: {tool}'}

            end_time = time.time()
            end_resources = self.get_system_resources()

            iteration_result = {
                'iteration': i + 1,
                'runtime_seconds': end_time - start_time,
                'start_resources': start_resources,
                'end_resources': end_resources,
                'result': result
            }

            results.append(iteration_result)

        # Calculate summary statistics
        runtimes = [r['runtime_seconds'] for r in results if r['result']['status'] == 'success']

        summary = {
            'tool': tool,
            'iterations_completed': len([r for r in results if r['result']['status'] == 'success']),
            'total_iterations': iterations,
            'average_runtime': sum(runtimes) / len(runtimes) if runtimes else 0,
            'min_runtime': min(runtimes) if runtimes else 0,
            'max_runtime': max(runtimes) if runtimes else 0,
            'gpu_accelerated': True,
            'results': results
        }

        return summary

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python run_parabricks.py <command> [options]")
        print("Commands: status, deepvariant, fq2bam, rnaseq, benchmark")
        sys.exit(1)

    command = sys.argv[1]
    service = ParabricksService()

    if command == 'status':
        status = service.check_parabricks_status()
        print(json.dumps(status, indent=2))

    elif command == 'deepvariant':
        if len(sys.argv) < 5:
            print("Usage: python run_parabricks.py deepvariant <bam_file> <reference> <output_dir>")
            sys.exit(1)

        bam_file = sys.argv[2]
        reference = sys.argv[3]
        output_dir = sys.argv[4]

        result = service.run_deepvariant_pipeline(bam_file, reference, output_dir)
        print(json.dumps(result, indent=2))

    elif command == 'fq2bam':
        if len(sys.argv) < 6:
            print("Usage: python run_parabricks.py fq2bam <fastq1> <fastq2> <reference> <output_dir>")
            sys.exit(1)

        fastq1 = sys.argv[2]
        fastq2 = sys.argv[3]
        reference = sys.argv[4]
        output_dir = sys.argv[5]

        result = service.run_fq2bam_pipeline(fastq1, fastq2, reference, output_dir)
        print(json.dumps(result, indent=2))

    elif command == 'benchmark':
        if len(sys.argv) < 4:
            print("Usage: python run_parabricks.py benchmark <tool> <config_file>")
            sys.exit(1)

        tool = sys.argv[2]
        config_file = sys.argv[3]

        try:
            with open(config_file, 'r') as f:
                config = json.load(f)

            result = service.benchmark_performance(tool, config['input_files'], config.get('iterations', 3))
            print(json.dumps(result, indent=2))

        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()