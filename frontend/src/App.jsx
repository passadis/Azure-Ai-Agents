import { useState } from 'react';
import axios from 'axios';
import { Brain } from 'lucide-react';

const ChatApp = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    
    const sendMessage = async () => {
        if (!input.trim()) return;
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat`, { userMessage: input })
            setMessages([...newMessages, { role: 'ai', content: response.data.aiResponse }]);
        } catch (error) {
            console.error('Error fetching AI response:', error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
            <div className="container mx-auto flex justify-center px-4">
                <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        Ask your Azure AI Agent
                    </h1>
                    
                    <div className="flex flex-col items-center space-y-4 mb-6">
                        <img
                            src="/logo.png"
                            alt="AI Agent Logo"
                            className="h-16 w-auto object-contain"
                        />
                        <div className="bg-blue-500 rounded-full p-4 shadow-lg">
                            <Brain className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <div className="h-80 overflow-y-auto border border-gray-200 mb-4 p-2 rounded-lg bg-gray-50">
                        {messages.slice(-5).map((msg, index) => (
                            <div 
                                key={index} 
                                className={`p-3 my-2 rounded-lg max-w-[80%] ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-100 ml-auto' 
                                        : 'bg-gray-200'
                                }`}
                            >
                                {msg.content}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button 
                            onClick={sendMessage} 
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;