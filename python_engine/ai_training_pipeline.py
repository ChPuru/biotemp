# python_engine/ai_training_pipeline.py
import os
import json
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sqlite3
from pathlib import Path
import logging
from typing import Dict, List, Any, Tuple
import hashlib
import shutil

# ML/DL imports
try:
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
    from sklearn.ensemble import RandomForestClassifier
    import joblib
except ImportError:
    print("scikit-learn not installed. Install with: pip install scikit-learn")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BioMapperTrainingPipeline:
    def __init__(self, base_dir: str = "python_engine/training_data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        # Database for training history
        self.db_path = self.base_dir / "training_history.db"
        self.models_dir = self.base_dir / "models"
        self.models_dir.mkdir(exist_ok=True)
        
        # Performance tracking
        self.performance_threshold = 0.85  # Minimum accuracy to deploy
        
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for training history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Training runs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                model_type TEXT NOT NULL,
                dataset_size INTEGER,
                accuracy REAL,
                precision_score REAL,
                recall_score REAL,
                f1_score REAL,
                training_time REAL,
                model_path TEXT,
                model_hash TEXT,
                hyperparameters TEXT,
                status TEXT DEFAULT 'completed',
                notes TEXT
            )
        ''')
        
        # Annotation feedback table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS annotation_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sequence_id TEXT NOT NULL,
                original_prediction TEXT,
                user_feedback TEXT,
                scientist_id TEXT,
                confidence_score REAL,
                timestamp TEXT,
                used_in_training BOOLEAN DEFAULT FALSE
            )
        ''')
        
        # Model comparison table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_comparisons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                baseline_model TEXT,
                new_model TEXT,
                improvement_percentage REAL,
                test_accuracy_baseline REAL,
                test_accuracy_new REAL,
                comparison_date TEXT,
                decision TEXT,
                deployed BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def collect_training_data(self) -> pd.DataFrame:
        """Collect and prepare training data from annotations and feedback."""
        conn = sqlite3.connect(self.db_path)
        
        # Get annotation feedback data
        query = '''
            SELECT sequence_id, original_prediction, user_feedback, 
                   confidence_score, timestamp
            FROM annotation_feedback 
            WHERE used_in_training = FALSE
        '''
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if df.empty:
            logger.warning("No new training data available")
            return df
        
        # Process and clean data
        df = self._preprocess_training_data(df)
        
        logger.info(f"Collected {len(df)} training samples")
        return df
    
    def _preprocess_training_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess training data for model training."""
        # Remove duplicates
        df = df.drop_duplicates(subset=['sequence_id'])
        
        # Filter out low confidence corrections
        df = df[df['confidence_score'] >= 0.7]
        
        # Create features (simplified - in real implementation, use sequence features)
        df['sequence_length'] = df['sequence_id'].str.len()
        df['has_correction'] = df['user_feedback'] != df['original_prediction']
        
        # Encode labels
        unique_species = df['user_feedback'].unique()
        species_to_id = {species: idx for idx, species in enumerate(unique_species)}
        df['species_id'] = df['user_feedback'].map(species_to_id)
        
        return df
    
    def train_model(self, df: pd.DataFrame, model_type: str = "random_forest") -> Dict[str, Any]:
        """Train a new model with the collected data."""
        if df.empty:
            raise ValueError("No training data available")
        
        start_time = datetime.now()
        
        # Prepare features and labels (simplified example)
        X = df[['sequence_length', 'confidence_score']].values
        y = df['species_id'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        if model_type == "random_forest":
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Calculate training time
        training_time = (datetime.now() - start_time).total_seconds()
        
        # Generate model hash for versioning
        model_hash = self._generate_model_hash(model)
        
        # Save model
        model_path = self.models_dir / f"{model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        joblib.dump(model, model_path)
        
        # Get detailed metrics
        report = classification_report(y_test, y_pred, output_dict=True)
        
        training_results = {
            'model_type': model_type,
            'accuracy': accuracy,
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_score': report['weighted avg']['f1-score'],
            'training_time': training_time,
            'model_path': str(model_path),
            'model_hash': model_hash,
            'dataset_size': len(df),
            'hyperparameters': json.dumps({
                'n_estimators': 100,
                'max_depth': 10,
                'random_state': 42
            })
        }
        
        # Save training results to database
        self._save_training_results(training_results)
        
        # Mark training data as used
        self._mark_data_as_used(df['sequence_id'].tolist())
        
        logger.info(f"Model trained successfully. Accuracy: {accuracy:.4f}")
        return training_results
    
    def _generate_model_hash(self, model) -> str:
        """Generate a hash for model versioning."""
        model_str = str(model.get_params())
        return hashlib.md5(model_str.encode()).hexdigest()[:8]
    
    def _save_training_results(self, results: Dict[str, Any]):
        """Save training results to database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO training_runs 
            (timestamp, model_type, dataset_size, accuracy, precision_score, 
             recall_score, f1_score, training_time, model_path, model_hash, hyperparameters)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            results['model_type'],
            results['dataset_size'],
            results['accuracy'],
            results['precision'],
            results['recall'],
            results['f1_score'],
            results['training_time'],
            results['model_path'],
            results['model_hash'],
            results['hyperparameters']
        ))
        
        conn.commit()
        conn.close()
    
    def _mark_data_as_used(self, sequence_ids: List[str]):
        """Mark training data as used."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        placeholders = ','.join(['?' for _ in sequence_ids])
        cursor.execute(f'''
            UPDATE annotation_feedback 
            SET used_in_training = TRUE 
            WHERE sequence_id IN ({placeholders})
        ''', sequence_ids)
        
        conn.commit()
        conn.close()
    
    def compare_models(self, new_model_path: str, baseline_model_path: str = None) -> Dict[str, Any]:
        """Compare new model with baseline model."""
        if baseline_model_path is None:
            baseline_model_path = self._get_latest_deployed_model()
        
        if not baseline_model_path or not os.path.exists(baseline_model_path):
            logger.warning("No baseline model found for comparison")
            return {"decision": "deploy", "reason": "no_baseline"}
        
        # Load models
        new_model = joblib.load(new_model_path)
        baseline_model = joblib.load(baseline_model_path)
        
        # Get test data for comparison
        test_data = self._get_test_dataset()
        if test_data.empty:
            logger.warning("No test data available for model comparison")
            return {"decision": "deploy", "reason": "no_test_data"}
        
        X_test = test_data[['sequence_length', 'confidence_score']].values
        y_test = test_data['species_id'].values
        
        # Evaluate both models
        baseline_accuracy = accuracy_score(y_test, baseline_model.predict(X_test))
        new_accuracy = accuracy_score(y_test, new_model.predict(X_test))
        
        improvement = ((new_accuracy - baseline_accuracy) / baseline_accuracy) * 100
        
        # Decision logic
        decision = "deploy" if new_accuracy > baseline_accuracy else "reject"
        
        comparison_results = {
            "baseline_accuracy": baseline_accuracy,
            "new_accuracy": new_accuracy,
            "improvement_percentage": improvement,
            "decision": decision,
            "comparison_date": datetime.now().isoformat()
        }
        
        # Save comparison results
        self._save_comparison_results(comparison_results, new_model_path, baseline_model_path)
        
        return comparison_results
    
    def _get_latest_deployed_model(self) -> str:
        """Get path to the latest deployed model."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT model_path FROM model_comparisons 
            WHERE deployed = TRUE 
            ORDER BY comparison_date DESC 
            LIMIT 1
        ''')
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None
    
    def _get_test_dataset(self) -> pd.DataFrame:
        """Get test dataset for model evaluation."""
        conn = sqlite3.connect(self.db_path)
        
        # Get a sample of historical data for testing
        query = '''
            SELECT sequence_id, original_prediction, user_feedback, confidence_score
            FROM annotation_feedback 
            WHERE used_in_training = TRUE
            ORDER BY RANDOM()
            LIMIT 100
        '''
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if not df.empty:
            df = self._preprocess_training_data(df)
        
        return df
    
    def _save_comparison_results(self, results: Dict[str, Any], new_model: str, baseline_model: str):
        """Save model comparison results."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO model_comparisons 
            (baseline_model, new_model, improvement_percentage, 
             test_accuracy_baseline, test_accuracy_new, comparison_date, decision)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            baseline_model,
            new_model,
            results['improvement_percentage'],
            results['baseline_accuracy'],
            results['new_accuracy'],
            results['comparison_date'],
            results['decision']
        ))
        
        conn.commit()
        conn.close()
    
    def deploy_model(self, model_path: str) -> bool:
        """Deploy a model to production."""
        try:
            # Copy model to production directory
            production_dir = Path("python_engine/production_models")
            production_dir.mkdir(exist_ok=True)
            
            production_path = production_dir / "current_model.pkl"
            shutil.copy2(model_path, production_path)
            
            # Update deployment status
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE model_comparisons 
                SET deployed = TRUE 
                WHERE new_model = ?
            ''', (model_path,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Model deployed successfully: {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to deploy model: {e}")
            return False
    
    def get_training_history(self) -> pd.DataFrame:
        """Get training history for analysis."""
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query('SELECT * FROM training_runs ORDER BY timestamp DESC', conn)
        conn.close()
        return df
    
    def add_annotation_feedback(self, sequence_id: str, original_prediction: str, 
                              user_feedback: str, scientist_id: str, confidence_score: float):
        """Add new annotation feedback for future training."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO annotation_feedback 
            (sequence_id, original_prediction, user_feedback, scientist_id, 
             confidence_score, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            sequence_id,
            original_prediction,
            user_feedback,
            scientist_id,
            confidence_score,
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def run_full_training_pipeline(self) -> Dict[str, Any]:
        """Run the complete training pipeline."""
        logger.info("Starting full training pipeline...")
        
        try:
            # Step 1: Collect training data
            training_data = self.collect_training_data()
            
            if training_data.empty:
                return {
                    "status": "skipped",
                    "reason": "No new training data available",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Step 2: Train new model
            training_results = self.train_model(training_data)
            
            # Step 3: Compare with baseline
            comparison_results = self.compare_models(training_results['model_path'])
            
            # Step 4: Deploy if better
            deployed = False
            if comparison_results['decision'] == 'deploy':
                deployed = self.deploy_model(training_results['model_path'])
            
            return {
                "status": "completed",
                "training_results": training_results,
                "comparison_results": comparison_results,
                "deployed": deployed,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

def main():
    """Main function for running training pipeline."""
    pipeline = BioMapperTrainingPipeline()
    
    # Add some sample annotation feedback for testing
    pipeline.add_annotation_feedback(
        "seq_001", "Species A", "Species B", "scientist_1", 0.85
    )
    pipeline.add_annotation_feedback(
        "seq_002", "Species C", "Species C", "scientist_2", 0.95
    )
    
    # Run training pipeline
    results = pipeline.run_full_training_pipeline()
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
