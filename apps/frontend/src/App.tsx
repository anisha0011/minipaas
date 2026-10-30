import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Applications } from './pages/Applications';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { Deployments } from './pages/deployments/Deployments';
import { DeploymentDetail } from './pages/deployments/DeploymentDetail';
import { Logs } from './pages/logs/Logs';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/deployments/:id" element={<DeploymentDetail />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<div>Settings (MVP Placeholder)</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
