import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ManufacturerRegistration from './components/ManufacturerRegistration';
import OAuthCallback from './components/OAuthCallback';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/manufacturer/registration" element={<ManufacturerRegistration />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                {/* ... other routes ... */}
            </Routes>
        </Router>
    );
}

export default App; 