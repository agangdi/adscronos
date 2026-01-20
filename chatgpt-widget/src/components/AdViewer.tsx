import React, { useState, useEffect } from 'react';
import type { AdSession } from '../types';

interface AdViewerProps {
  adSession: AdSession;
  onAdComplete: () => void;
}

export function AdViewer({ adSession, onAdComplete }: AdViewerProps) {
  const [timeRemaining, setTimeRemaining] = useState(adSession.duration);
  const [adCompleted, setAdCompleted] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setAdCompleted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setAdCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleComplete = () => {
    if (adCompleted) {
      onAdComplete();
    }
  };

  return (
    <div className="ad-viewer">
      <div className="ad-header">
        <h3>Advertisement</h3>
        <span className="ad-timer">
          {adCompleted ? 'Ad Complete!' : `${timeRemaining}s remaining`}
        </span>
      </div>
      
      <div className="ad-content">
        <iframe
          src={adSession.adUrl}
          className="ad-iframe"
          title="Advertisement"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div className="ad-footer">
        <p className="ad-notice">
          {adCompleted 
            ? 'You can now proceed to access the premium content.'
            : 'Please watch the entire ad to unlock premium content.'}
        </p>
        <button
          className="complete-btn"
          onClick={handleComplete}
          disabled={!adCompleted}
        >
          {adCompleted ? 'Continue to Payment' : 'Please Wait...'}
        </button>
      </div>
    </div>
  );
}
