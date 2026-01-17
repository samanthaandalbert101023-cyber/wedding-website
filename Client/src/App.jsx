import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Envelope from './pages/Envelope';
import Index from './pages/Index';

function App() {
  return (
    <Routes>
      {/* Landing page with the envelope */}
      <Route path="/" element={<Envelope />} />
      
      {/* Dashboard/Home page after opening */}
      <Route path="/Index" element={<Index />} />
    </Routes>
  );
}

export default App;