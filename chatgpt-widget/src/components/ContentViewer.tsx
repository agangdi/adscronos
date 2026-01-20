import React from 'react';
import type { PaymentInfo } from '../types';

interface ContentViewerProps {
  title: string;
  content: string;
  payment?: PaymentInfo;
}

export function ContentViewer({ title, content, payment }: ContentViewerProps) {
  return (
    <div className="content-viewer">
      <div className="content-header">
        <h2>{title}</h2>
        {payment && (
          <div className="payment-badge">
            <span className="badge-icon">✓</span>
            <span>Paid</span>
          </div>
        )}
      </div>

      <div className="content-body">
        <div className="content-text">{content}</div>
      </div>

      {payment && (
        <div className="payment-info">
          <h4>Payment Details</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Transaction:</span>
              <a
                href={`https://explorer.cronos.org/testnet/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="info-value link"
              >
                {payment.txHash?.slice(0, 10)}...{payment.txHash?.slice(-8)}
              </a>
            </div>
            <div className="info-item">
              <span className="info-label">Amount:</span>
              <span className="info-value">
                {payment.value ? (parseInt(payment.value) / 1000000).toFixed(2) : '0'} USDX
              </span>
            </div>
            {payment.blockNumber && (
              <div className="info-item">
                <span className="info-label">Block:</span>
                <span className="info-value">#{payment.blockNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
