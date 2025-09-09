// frontend/src/components/BioAgentChat.tsx
import React, { useState } from 'react';
import axios from 'axios';
import './BioAgentChat.css';

interface Message {
    sender: 'user' | 'agent';
    text: string;
}

interface BioAgentChatProps {
    analysisContext: any; // The full analysisResults object
}

const BioAgentChat: React.FC<BioAgentChatProps> = ({ analysisContext }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<'standard' | 'expert' | 'novelty_detection' | 'training_assistance'>('standard');
    const [includeRawDNA, setIncludeRawDNA] = useState(false);
    const [modelUsed, setModelUsed] = useState<string>('llama3:8b-instruct-q4_K_M');

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5001/api/analysis/chat', {
                message: input,
                context: analysisContext,
                analysisMode: analysisMode,
                includeRawDNA: includeRawDNA
            });

            const agentMessage: Message = {
                sender: 'agent',
                text: response.data.reply
            };

            // Update model information if provided
            if (response.data.model_used) {
                setModelUsed(response.data.model_used);
            }

            setMessages(prev => [...prev, agentMessage]);

            // Add metadata about the analysis if available
            if (response.data.analysis_mode && response.data.context_used) {
                const metadataMessage: Message = {
                    sender: 'agent',
                    text: `📊 Analysis Mode: ${response.data.analysis_mode} | Data Access: ${response.data.context_used} | Model: ${response.data.model_used || 'Unknown'}`
                };
                setMessages(prev => [...prev, metadataMessage]);
            }

        } catch (error) {
            const errorMessage: Message = {
                sender: 'agent',
                text: "I'm experiencing technical difficulties accessing the enhanced analysis data. Please ensure Ollama is running and try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <h4 className="results-section-header">🧠 Bio-Agent: Enhanced AI Research Assistant</h4>

            {/* Enhanced Controls */}
            <div className="enhanced-controls">
                <div className="control-group">
                    <label>Analysis Mode:</label>
                    <select
                        value={analysisMode}
                        onChange={(e) => setAnalysisMode(e.target.value as any)}
                        className="mode-select"
                    >
                        <option value="standard">🧪 Standard Analysis</option>
                        <option value="expert">🔬 Expert Mode (Raw DNA)</option>
                        <option value="novelty_detection">🆕 Novelty Detection</option>
                        <option value="training_assistance">🎯 Training Assistance</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={includeRawDNA}
                            onChange={(e) => setIncludeRawDNA(e.target.checked)}
                        />
                        Include Raw DNA Sequences
                    </label>
                </div>

                <div className="model-info">
                    <span className="model-badge">🤖 {modelUsed}</span>
                    {analysisContext?.analysis_metadata?.dna_sequences_available && (
                        <span className="data-badge">🧬 DNA Data Available</span>
                    )}
                </div>
            </div>

            <div className="chat-window">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <h5>👋 Welcome to Enhanced Bio-Agent Chat!</h5>
                        <p>I'm now equipped with:</p>
                        <ul>
                            <li>🔬 Raw DNA sequence analysis</li>
                            <li>🧬 Evo2/InstaAI model integration</li>
                            <li>🆕 Real-time novelty detection</li>
                            <li>🎯 Training data assistance</li>
                            <li>📊 Multi-modal analysis capabilities</li>
                        </ul>
                        <p><strong>Try asking:</strong> "Analyze the novelty of sequence SEQ_001" or "What training improvements do you suggest?"</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-message agent loading">
                        <span className="loading-spinner">⟳</span>
                        Analyzing with enhanced AI models...
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        analysisMode === 'expert' ? "Ask about raw DNA sequences..." :
                        analysisMode === 'novelty_detection' ? "Ask about novel species detection..." :
                        analysisMode === 'training_assistance' ? "Ask about model training..." :
                        "Ask about the analysis results..."
                    }
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()}>
                    {isLoading ? '⟳' : '📤'} Send
                </button>
            </form>
        </div>
    );
};

export default BioAgentChat;