import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Envelope from './pages/Envelope';
import Index from './pages/Index';
import AdminResults from './pages/AdminResults';

function App() {
  return (
    <Routes>
      {/* Landing page with the envelope */}
      <Route path="/" element={<Envelope />} />
      
      {/* Index /Home page after opening */}
      <Route path="/Index" element={<Index />} />

      <Route path="/admin-results" element={<AdminResults />} />
    </Routes>
  );
}

export default App;