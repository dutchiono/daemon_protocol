import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './wallet/WalletProvider';
import Feed from './components/Feed';
import PostComposer from './components/PostComposer';
import Profile from './components/Profile';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [currentView, setCurrentView] = useState<'feed' | 'compose' | 'profile'>('feed');
  const [fid, setFid] = useState<number | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider onFidChange={setFid}>
        <div className="app">
          <header className="app-header">
            <h1>Daemon Social</h1>
            <nav>
              <button onClick={() => setCurrentView('feed')}>Feed</button>
              <button onClick={() => setCurrentView('compose')}>Compose</button>
              <button onClick={() => setCurrentView('profile')}>Profile</button>
            </nav>
          </header>

          <main className="app-main">
            {currentView === 'feed' && <Feed fid={fid} />}
            {currentView === 'compose' && <PostComposer fid={fid} onPostCreated={() => setCurrentView('feed')} />}
            {currentView === 'profile' && fid && <Profile fid={fid} />}
          </main>
        </div>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;

