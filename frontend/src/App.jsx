import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Landing Page</div>} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/home" element={<div>Home Page</div>} />
      </Routes>
    </Router>
  );
}

export default App;
