import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CommandCenter from './pages/CommandCenter';
import Track from './pages/Track';
import Home from './pages/Home';
import Guide from './pages/Guide';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        
        {/* The Civic Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/track" element={<Track />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Default route redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
