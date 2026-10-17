import React, { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import SafetyAnalyzer from './components/SafetyAnalyzer';

function getInitialRoute() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.startsWith('/analyze') ? '/analyze' : '/';
}

export default function App() {
  const [route, setRoute] = useState(getInitialRoute);
  const [prefilledText, setPrefilledText] = useState('');
  const [initialTab, setInitialTab] = useState('text');

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname.startsWith('/analyze') ? '/analyze' : '/';
      setRoute(currentPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path, prefill = '', tab = 'text') => {
    setRoute(path);
    setPrefilledText(prefill);
    setInitialTab(tab);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (route === '/analyze') {
    return (
      <SafetyAnalyzer
        onNavigateHome={() => navigateTo('/')}
        initialText={prefilledText}
        initialTab={initialTab}
      />
    );
  }

  return (
    <LandingPage
      onNavigateAnalyze={(prefill) => navigateTo('/analyze', prefill, 'text')}
      onNavigateMode={(mode) => navigateTo('/analyze', '', mode)}
    />
  );
}
