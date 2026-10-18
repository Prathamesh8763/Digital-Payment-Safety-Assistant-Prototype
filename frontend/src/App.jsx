import React, { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import SafetyAnalyzer from './components/SafetyAnalyzer';
import GuidedHelpPage from './components/GuidedHelpPage';

function getInitialRoute() {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname;
  if (path.startsWith('/guided-help') || path.startsWith('/guided')) return '/guided-help';
  if (path.startsWith('/analyze')) return '/analyze';
  return '/';
}

export default function App() {
  const [route, setRoute] = useState(getInitialRoute);
  const [prefilledText, setPrefilledText] = useState('');
  const [initialTab, setInitialTab] = useState('text');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/guided-help') || path.startsWith('/guided')) {
        setRoute('/guided-help');
      } else if (path.startsWith('/analyze')) {
        setRoute('/analyze');
      } else {
        setRoute('/');
      }
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

  if (route === '/guided-help') {
    return (
      <GuidedHelpPage
        onNavigateHome={() => navigateTo('/')}
        onNavigateAnalyze={() => navigateTo('/analyze')}
      />
    );
  }

  if (route === '/analyze') {
    return (
      <SafetyAnalyzer
        onNavigateHome={() => navigateTo('/')}
        onNavigateGuided={() => navigateTo('/guided-help')}
        initialText={prefilledText}
        initialTab={initialTab}
      />
    );
  }

  return (
    <LandingPage
      onNavigateAnalyze={(prefill) => navigateTo('/analyze', prefill, 'text')}
      onNavigateMode={(mode) => (mode === 'guided' ? navigateTo('/guided-help') : navigateTo('/analyze', '', mode))}
      onNavigateGuided={() => navigateTo('/guided-help')}
    />
  );
}
