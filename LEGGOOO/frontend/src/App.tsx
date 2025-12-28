import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workspace/:id" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder components - to be implemented
function Home() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">LEGGOOO</h1>
        <p className="text-text-secondary mb-8">Real-Time Collaborative Coding IDE</p>
        <button className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
}

function Workspace() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="flex h-screen">
        {/* File Tree - Left */}
        <aside className="w-64 bg-bg-secondary border-r border-border">
          <div className="p-4">File Tree</div>
        </aside>
        
        {/* Editor - Center */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 bg-bg-editor">
            {/* Monaco Editor will go here */}
            <div className="p-4 text-text-muted">Editor Pane</div>
          </div>
        </main>
        
        {/* AI Pane - Right */}
        <aside className="w-80 bg-bg-secondary border-l border-border">
          <div className="p-4">AI Assistant</div>
        </aside>
      </div>
    </div>
  );
}

export default App;
