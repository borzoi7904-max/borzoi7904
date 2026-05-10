import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

// .env 파일에서 VITE_GOOGLE_CLIENT_ID를 가져옵니다.
// 없다면 개발 편의성을 위해 임시 에러 메시지를 띄우지만 앱이 터지진 않게 처리합니다.
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
