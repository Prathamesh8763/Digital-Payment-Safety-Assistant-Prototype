import React from 'react';

export default function ThreeStepsSection() {
  const steps = [
    {
      num: '01',
      title: 'Share the message',
      desc: 'Paste only the text you want to review. Remove personal details first.'
    },
    {
      num: '02',
      title: 'Review the signals',
      desc: 'See the language and patterns that may indicate a scam.'
    },
    {
      num: '03',
      title: 'Choose a safe next step',
      desc: 'Pause, verify through an official source, and decide for yourself.'
    }
  ];

  return (
    <section id="how-it-works" className="landing-dark-section" aria-labelledby="steps-title">
      <div className="landing-dark-container">
        <div className="landing-dark-tag">THREE SIMPLE STEPS</div>
        <h2 id="steps-title" className="landing-dark-title">
          A small pause can make<br />a meaningful difference.
        </h2>
        <p className="landing-dark-subtitle">
          Get a second opinion without handing over control.
        </p>

        <div className="landing-dark-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="landing-dark-card">
              <div className="landing-dark-card-num">{step.num}</div>
              <h3 className="landing-dark-card-title">{step.title}</h3>
              <p className="landing-dark-card-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
