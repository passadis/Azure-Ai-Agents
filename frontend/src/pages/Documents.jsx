import { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/documents`, {
                    headers: {
                        'Ocp-Apim-Subscription-Key': import.meta.env.VITE_APIM_KEY,
                        'Content-Type': 'application/json',
                    },
                });
                setDocuments(response.data);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchDocuments();
    }, []);

    const getDownloadUrl = (doc) => doc.storagePath || doc.fileUrl || '#';
    const getTitle = (doc) => doc.title?.trim() ? doc.title : doc.originalFileName || 'Untitled Document';
    const getSummary = (doc) => doc.summary?.trim() ? doc.summary : 'No summary available';

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 p-6">
            <div className="absolute top-4 right-4 flex gap-2">
                <a href="/" className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded">Home</a>
                <a href="/documents" className="px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded">Documents</a>
            </div>
    
            <div className="container mx-auto flex flex-col items-center px-4 text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Stored Documents</h1>
                <div className="flex flex-col items-center space-y-4">
                    <img src="/logo.png" alt="AI Agent Logo" className="h-16 w-auto object-contain" />
                    <div className="bg-blue-500 rounded-full p-4 shadow-lg">
                        <FileText className="w-12 h-12 text-white" />
                    </div>
                </div>
            </div>
    
            <div className="container mx-auto px-4">
                {loading ? (
                    <p className="text-gray-600 text-center">Loading...</p>
                ) : documents.length === 0 ? (
                    <p className="text-gray-600 text-center">No documents found.</p>
                ) : (
                    <table className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                        <thead className="bg-blue-500 text-white">
                            <tr>
                                <th className="p-3 text-left">Title</th>
                                <th className="p-3 text-left">Summary</th>
                                <th className="p-3 text-left">Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{getTitle(doc)}</td>
                                    <td className="p-3">
                                        <div className="max-h-32 overflow-y-auto">{getSummary(doc)}</div>
                                    </td>
                                    <td className="p-3">
                                        <a href={getDownloadUrl(doc)} target="_blank" rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors inline-block">
                                            Download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Documents;
