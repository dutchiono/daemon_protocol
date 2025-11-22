import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

