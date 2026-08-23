import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { storage } from './lib/storage';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in USFRAME App:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      // Step 8: Clear only volatile UI and offline caches, preserving Supabase user auth tokens
      storage.resetOfflineCaches();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF8F5',
          color: '#1C1917',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: '1px solid #EDE8E1'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: '#D95D39',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 auto 16px'
            }}>
              US
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Memulihkan Ruang Pasangan
            </h2>
            <p style={{ fontSize: '13px', color: '#78716C', lineHeight: '1.6', margin: '0 0 20px' }}>
              Terjadi sedikit penyesuaian cache browser. Klik tombol di bawah untuk menyegarkan dan memuat ruang pasangan Anda.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#D95D39',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Segarkan & Buka USFRAME
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
