// backend/services/xai_service.js
const { PythonShell } = require('python-shell');
const path = require('path');

const getLiveXaiExplanation = (sequence) => {
    const modelPath = path.join(__dirname, '../../python_engine/models/nucleotide_transformer_finetuned');
    const options = {
        mode: 'text',
        pythonPath: 'py',
        scriptPath: path.join(__dirname, '../../python_engine/'),
        args: [sequence, modelPath]
    };
    return new Promise((resolve, reject) => {
        PythonShell.run('run_xai.py', options)
            .then(messages => resolve(JSON.parse(messages.join(''))))
            .catch(err => reject(err));
    });
};

module.exports = { getLiveXaiExplanation };