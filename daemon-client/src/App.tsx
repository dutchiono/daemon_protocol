import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './wallet/WalletProvider';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Feed from './pages/Feed';
import Notifications from './pages/Notifications';
import Channels from './pages/Channels';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Compose from './pages/Compose';
import About from './pages/About';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:fid" element={<Profile />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
