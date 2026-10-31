import React, { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import SafetyAnalyzer from './components/SafetyAnalyzer';
import GuidedHelpPage from './components/GuidedHelpPage';
import CheckLinkPage from './components/CheckLinkPage';
import SubscriptionSafetyPage from './components/SubscriptionSafetyPage';
import IndianScamGuidePage from './components/IndianScamGuidePage';
import ReportGuidancePage from './components/ReportGuidancePage';
import apiClient from './services/apiClient';

function getInitialRoute() {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname;
  if (path.startsWith('/check-link') || path.startsWith('/check')) return '/check-link';
  if (path.startsWith('/guided-help') || path.startsWith('/guided')) return '/guided-help';
  if (path.startsWith('/subscriptions') || path.startsWith('/subscription')) return '/subscriptions';
  if (path.startsWith('/scam-guide') || path.startsWith('/scams')) return '/scam-guide';
  if (path.startsWith('/report') || path.startsWith('/cybercrime')) return '/report';
  if (path.startsWith('/analyze')) return '/analyze';
  return '/';
}

export default function App() {
  const [route, setRoute] = useState(getInitialRoute);
  const [prefilledText, setPrefilledText] = useState('');
  const [initialTab, setInitialTab] = useState('text');

  useEffect(() => {
    // Silently pre-warm sleeping backend on cloud hosting (Render free tier)
    apiClient.pingHealth();

    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/check-link') || path.startsWith('/check')) {
        setRoute('/check-link');
      } else if (path.startsWith('/guided-help') || path.startsWith('/guided')) {
        setRoute('/guided-help');
      } else if (path.startsWith('/subscriptions') || path.startsWith('/subscription')) {
        setRoute('/subscriptions');
      } else if (path.startsWith('/scam-guide') || path.startsWith('/scams')) {
        setRoute('/scam-guide');
      } else if (path.startsWith('/report') || path.startsWith('/cybercrime')) {
        setRoute('/report');
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

  if (route === '/check-link') {
    return (
      <CheckLinkPage
        onNavigateHome={() => navigateTo('/')}
        onNavigateAnalyze={() => navigateTo('/analyze')}
        onNavigateGuided={() => navigateTo('/guided-help')}
      />
    );
  }

  if (route === '/guided-help') {
    return (
      <GuidedHelpPage
        onNavigateHome={() => navigateTo('/')}
        onNavigateAnalyze={() => navigateTo('/analyze')}
      />
    );
  }

  if (route === '/subscriptions') {
    return (
      <SubscriptionSafetyPage
        onNavigateHome={() => navigateTo('/')}
        onNavigateCheckLink={() => navigateTo('/check-link')}
        onNavigateAnalyze={() => navigateTo('/analyze')}
      />
    );
  }

  if (route === '/scam-guide') {
    return (
      <IndianScamGuidePage
        onNavigateHome={() => navigateTo('/')}
        onNavigateAnalyze={(sampleText) => navigateTo('/analyze', sampleText || '', 'message')}
        onNavigateReport={() => navigateTo('/report')}
      />
    );
  }

  if (route === '/report') {
    return (
      <ReportGuidancePage
        onNavigateHome={() => navigateTo('/')}
        onNavigateScamGuide={() => navigateTo('/scam-guide')}
        onNavigateAnalyze={(sampleText) => navigateTo('/analyze', sampleText || '', 'message')}
      />
    );
  }

  if (route === '/analyze') {
    return (
      <SafetyAnalyzer
        onNavigateHome={() => navigateTo('/')}
        onNavigateGuided={() => navigateTo('/guided-help')}
        onNavigateReport={() => navigateTo('/report')}
        onNavigateScamGuide={() => navigateTo('/scam-guide')}
        initialText={prefilledText}
        initialTab={initialTab}
      />
    );
  }

  return (
    <LandingPage
      onNavigateAnalyze={(prefill) => navigateTo('/analyze', prefill, 'text')}
      onNavigateMode={(mode) => {
        if (mode === 'guided') navigateTo('/guided-help');
        else if (mode === 'url' || mode === 'qr') navigateTo('/check-link');
        else if (mode === 'subscriptions') navigateTo('/subscriptions');
        else if (mode === 'scam-guide') navigateTo('/scam-guide');
        else if (mode === 'report') navigateTo('/report');
        else navigateTo('/analyze', '', mode);
      }}
      onNavigateGuided={() => navigateTo('/guided-help')}
      onNavigateCheckLink={() => navigateTo('/check-link')}
      onNavigateSubscriptions={() => navigateTo('/subscriptions')}
      onNavigateScamGuide={() => navigateTo('/scam-guide')}
      onNavigateReport={() => navigateTo('/report')}
    />
  );
}
