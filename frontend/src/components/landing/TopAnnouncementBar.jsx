import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function TopAnnouncementBar({ onLearnMore }) {
  const { t } = useTranslation();

  const handleClick = (e) => {
    if (onLearnMore) {
      e.preventDefault();
      onLearnMore();
    }
  };

  return (
    <div className="landing-topbar" role="region" aria-label="Announcement">
      <span>{t('landing.announcement', 'A calmer way to handle suspicious payment messages')}</span>
      <a
        href="#how-it-works"
        onClick={handleClick}
        className="landing-topbar-link"
      >
        <span>{t('common.nav_how_it_works', 'Learn how it works')}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
