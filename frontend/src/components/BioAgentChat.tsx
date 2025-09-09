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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post<{ reply: string }>('http://localhost:5001/api/analysis/chat', {
                message: input,
                context: analysisContext
            });
            const agentMessage: Message = { sender: 'agent', text: response.data.reply };
            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'agent', text: "Sorry, I'm having trouble connecting to my brain right now." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <h4 className="results-section-header">Bio-Agent: Your Conversational Research Assistant</h4>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="chat-message agent">Thinking...</div>}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the results..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
};

export default BioAgentChat;