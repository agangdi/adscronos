import React, { useState } from 'react';
import type { PaymentRequirements } from '../types';
import { connectWallet, switchToNetwork, createPaymentHeader } from '../payment-utils';

interface PaymentFlowProps {
  paymentRequirements: PaymentRequirements;
  resourceTitle: string;
  onPaymentComplete: (paymentHeader: string) => void;
  onCancel: () => void;
}

export function PaymentFlow({
  paymentRequirements,
  resourceTitle,
  onPaymentComplete,
  onCancel,
}: PaymentFlowProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setStatus('connecting');
      setError(null);

      const provider = await connectWallet();
      if (!provider) {
        setError('Failed to connect wallet');
        setStatus('idle');
        return;
      }

      const networkSwitched = await switchToNetwork(paymentRequirements.network);
      if (!networkSwitched) {
        setError('Failed to switch to the correct network');
        setStatus('idle');
        return;
      }

      setStatus('signing');
      const paymentHeader = await createPaymentHeader(paymentRequirements, provider);

      setStatus('processing');
      onPaymentComplete(paymentHeader);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setStatus('idle');
    }
  };

  const priceInUSDX = (parseInt(paymentRequirements.maxAmountRequired) / 1000000).toFixed(2);

  return (
    <div className="payment-flow">
      <div className="payment-header">
        <h3>Complete Payment</h3>
        <p className="payment-description">{paymentRequirements.description}</p>
      </div>

      <div className="payment-details">
        <div className="detail-row">
          <span className="label">Resource:</span>
          <span className="value">{resourceTitle}</span>
        </div>
        <div className="detail-row">
          <span className="label">Amount:</span>
          <span className="value price-highlight">{priceInUSDX} USDX</span>
        </div>
        <div className="detail-row">
          <span className="label">Network:</span>
          <span className="value">
            {paymentRequirements.network === 'cronos' ? 'Cronos Mainnet' : 'Cronos Testnet'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="payment-actions">
        <button
          className="cancel-btn"
          onClick={onCancel}
          disabled={status !== 'idle'}
        >
          Cancel
        </button>
        <button
          className="pay-btn"
          onClick={handlePayment}
          disabled={status !== 'idle'}
        >
          {status === 'idle' && 'Pay with Wallet'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'signing' && 'Please Sign...'}
          {status === 'processing' && 'Processing...'}
        </button>
      </div>

      <p className="payment-notice">
        You will be prompted to sign a transaction authorization in your wallet.
        No funds will be transferred until you approve.
      </p>
    </div>
  );
}
