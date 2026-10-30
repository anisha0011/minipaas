import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Applications } from './pages/Applications';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/deployments" element={<div>Deployments</div>} />
          <Route path="/logs" element={<div>Logs</div>} />
          <Route path="/settings" element={<div>Settings</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
