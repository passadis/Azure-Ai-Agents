// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatApp from './pages/ChatApp';  // Move current App.jsx content to ChatApp.jsx
import Documents from './pages/Documents';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatApp />} />
        <Route path="/documents" element={<Documents />} />
      </Routes>
    </Router>
  );
}

export default App;