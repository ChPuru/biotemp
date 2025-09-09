// backend/services/kaggle_service.js
// const KaggleApi = require('kaggle-api'); // Commented out - not using Kaggle service

// CRITICAL: You must place your kaggle.json API token in this location
// See: https://github.com/Kaggle/kaggle-api#api-credentials
// const api = new KaggleApi(); // Commented out - not using Kaggle service

/*
const startRetrainingJob = async (newDatasetPath) => {
    try {
        await api.authenticate();
        console.log("--- ✅ Authenticated with Kaggle API ---");

        // In a real scenario, you would push the new dataset and then start the notebook.
        // For the demo, we'll just trigger a run of the existing notebook.
        const notebookId = "yourusername/your-notebook-slug"; // <-- REPLACE THIS

        console.log(`--- 🚀 Triggering new training run for notebook: ${notebookId} ---`);
        // This command starts a new "Commit" run of your training notebook.
        await api.notebooksRun(notebookId, {
            notebookRunRequest: {
                // You can pass parameters to your notebook here if needed
            }
        });

        console.log("--- ✅ New training run successfully started on Kaggle! ---");
        return { status: "success", message: `New training run started for ${notebookId}.` };
    } catch (error) {
        console.error("--- ❌ Kaggle API Error ---", error);
        return { status: "error", message: "Failed to start retraining job." };
    }
};
*/

// module.exports = { startRetrainingJob }; // Commented out - not using Kaggle service