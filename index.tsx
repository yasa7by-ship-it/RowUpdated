import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import { AnnouncementsProvider } from './contexts/AnnouncementsContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
} 

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AppSettingsProvider>
        <AuthProvider>
          <FavoritesProvider>
            <LanguageProvider>
              <AnnouncementsProvider>
                <App />
              </AnnouncementsProvider>
            </LanguageProvider>
          </FavoritesProvider>
        </AuthProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
);