import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Analytics from './pages/Analytics';
import CreateEvent from './pages/CreateEvent';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/create" element={<CreateEvent />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;