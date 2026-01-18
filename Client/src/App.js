import React, { useState } from 'react';
import Envelope from './components/Envelope';
import Index from './pages/Index';

function App() {
  const [showMainSite, setShowMainSite] = useState(false);

  return (
    <div className="app-container">
      {!showMainSite ? (
        <Envelope onOpenComplete={() => setShowMainSite(true)} />
      ) : (
        <Index />
      )}
    </div>
  );
}

export default App;