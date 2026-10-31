import React from 'react';
import TopAnnouncementBar from './TopAnnouncementBar';
import LandingNavbar from './LandingNavbar';
import HeroSection from './HeroSection';
import TrustBar from './TrustBar';
import FeatureOverviewSection from './FeatureOverviewSection';
import DetectionScopeSection from './DetectionScopeSection';
import ThreeStepsSection from './ThreeStepsSection';
import PrivacyCalloutSection from './PrivacyCalloutSection';
import CtaBannerSection from './CtaBannerSection';
import LandingFooter from './LandingFooter';
import '../../styles/landing.css';

export default function LandingPage({
  onNavigateAnalyze,
  onNavigateMode,
  onNavigateGuided,
  onNavigateCheckLink,
  onNavigateSubscriptions,
  onNavigateScamGuide,
  onNavigateReport
}) {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyzeClick = () => {
    if (onNavigateAnalyze) {
      onNavigateAnalyze();
    }
  };

  const handleAnalyzeWithDemo = (demoText) => {
    if (onNavigateAnalyze) {
      onNavigateAnalyze(demoText);
    }
  };

  const handleExploreClick = (mode) => {
    if (onNavigateMode) {
      onNavigateMode(mode);
    } else if (onNavigateAnalyze) {
      onNavigateAnalyze();
    }
  };

  return (
    <div className="landing-page">
      {/* 1. Top Announcement Bar */}
      <TopAnnouncementBar onLearnMore={() => scrollToSection('how-it-works')} />

      {/* 2. Main Navigation Bar */}
      <LandingNavbar
        onAnalyzeClick={handleAnalyzeClick}
        onNavigateSection={scrollToSection}
        onNavigateGuided={onNavigateGuided}
        onNavigateCheckLink={onNavigateCheckLink}
        onNavigateSubscriptions={onNavigateSubscriptions}
        onNavigateScamGuide={onNavigateScamGuide}
        onNavigateReport={onNavigateReport}
      />

      <main id="main-content">
        {/* 3. Hero Section (with HeroDemoCard) */}
        <HeroSection
          onAnalyzeClick={handleAnalyzeClick}
          onHowItWorksClick={() => scrollToSection('how-it-works')}
          onAnalyzeWithDemo={handleAnalyzeWithDemo}
        />

        {/* 4. Trust & Confidence Bar */}
        <TrustBar />

        {/* 5. Feature Overview Section */}
        <FeatureOverviewSection onExploreClick={handleExploreClick} />

        {/* 5b. Detection Scope & Boundaries Section */}
        <DetectionScopeSection onNavigateReport={onNavigateReport} />

        {/* 6. Three Simple Steps Section */}
        <ThreeStepsSection />

        {/* 7. Privacy Reassurance Section */}
        <PrivacyCalloutSection />

        {/* 8. Call to Action Banner */}
        <CtaBannerSection onAnalyzeClick={handleAnalyzeClick} />
      </main>

      {/* 9. Landing Footer */}
      <LandingFooter
        onNavigateSection={scrollToSection}
        onNavigateAnalyze={handleAnalyzeClick}
        onNavigateCheckLink={onNavigateCheckLink}
        onNavigateSubscriptions={onNavigateSubscriptions}
        onNavigateGuided={onNavigateGuided}
        onNavigateScamGuide={onNavigateScamGuide}
        onNavigateReport={onNavigateReport}
      />
    </div>
  );
}
