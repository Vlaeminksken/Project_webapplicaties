import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Logger';
import Register from './components/Register';
import Home from './components/Home';

function App() {
    const [notification, setNotification] = useState('');

    return (
        <Router>
            <div className="App">
                {notification && (
                    <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                        {notification}
                    </div>
                )}
                <Routes>
                    <Route
                        path="/"
                        element={<Login setNotification={setNotification} />}
                    />
                    <Route
                        path="/register"
                        element={<Register setNotification={setNotification} />}
                    />
                    <Route path="/home" element={<Home />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;