// backend/services/quantum_service.js
const { PythonShell } = require('python-shell');
const path = require('path');

const runQuantumJob = () => {
    const options = {
        mode: 'text',
        pythonPath: 'py',
        scriptPath: path.join(__dirname, '../../python_engine/'),
        args: []
    };
    return new Promise((resolve, reject) => {
        PythonShell.run('run_quantum.py', options)
            .then(messages => resolve(JSON.parse(messages.join(''))))
            .catch(err => reject(err));
    });
};

module.exports = { runQuantumJob };