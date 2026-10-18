import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function TopAnnouncementBar({ onLearnMore }) {
  const handleClick = (e) => {
    if (onLearnMore) {
      e.preventDefault();
      onLearnMore();
    }
  };

  return (
    <div className="landing-topbar" role="region" aria-label="Announcement">
      <span>A calmer way to handle suspicious payment messages</span>
      <a
        href="#how-it-works"
        onClick={handleClick}
        className="landing-topbar-link"
      >
        <span>Learn how it works</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}
