import React from 'react';

export default function TrustBar() {
  const items = [
    { num: '01', text: 'Understand the warning signs' },
    { num: '02', text: 'Get a clear next step' },
    { num: '03', text: 'Stay in control' }
  ];

  return (
    <div className="landing-trustbar-section" role="region" aria-label="Key Benefits">
      <div className="landing-trustbar-card">
        {items.map((item, index) => (
          <div key={index} className="landing-trustbar-item">
            <span className="landing-trustbar-num" aria-hidden="true">{item.num}</span>
            <span className="landing-trustbar-text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
