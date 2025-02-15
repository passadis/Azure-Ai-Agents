import { useState } from 'react';
import axios from 'axios';
import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
//import Documents from './pages/Documents';

const ChatApp = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        // If user types "upload:", show file input but do NOT add it to messages
        if (input.startsWith('upload:')) {
            setShowUpload(true);
            setInput('');  // Clear input field
            return;
        }

        // Add user message to chat
        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');

        try {
            setLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat`,
                { userMessage: input },
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': import.meta.env.VITE_APIM_KEY,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Append AI response
            setMessages([...newMessages, { role: 'ai', content: response.data.aiResponse || "No response." }]);
        } catch (error) {
            console.error('Error fetching AI response:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/upload`,
                formData,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': import.meta.env.VITE_APIM_KEY,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Ensure response contains the summary
            const summary = response.data.summary || "Upload complete, but no summary available.";
            setMessages([...messages, { role: 'ai', content: summary }]);
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessages([...messages, { role: 'ai', content: "File upload failed." }]);
        } finally {
            setLoading(false);
            setShowUpload(false);
            setFile(null);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
                {/* Top-right menu */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <Link
                        to="/"
                        className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                    >
                        Home
                    </Link>
                    <Link
                        to="/documents"
                        className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                    >
                        Documents
                    </Link>
                </div>
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

                    {showUpload && (
                        <div className="mb-4 flex items-center gap-2">
                            <input 
                                type="file" 
                                onChange={(e) => setFile(e.target.files[0])} 
                                className="flex-grow p-2 border border-gray-300 rounded-lg"
                            />
                            <button 
                                onClick={handleFileUpload} 
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Upload
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;
