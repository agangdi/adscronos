import React, { useState, useEffect } from 'react';
import type { ToolOutput, ToolMetadata } from './types';
import { ResourceList } from './components/ResourceList';
import { AdViewer } from './components/AdViewer';
import { PaymentFlow } from './components/PaymentFlow';
import { ContentViewer } from './components/ContentViewer';

type ViewState = 'list' | 'ad' | 'payment' | 'content' | 'error';

export function App() {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [toolOutput, setToolOutput] = useState<ToolOutput | null>(null);
  const [metadata, setMetadata] = useState<ToolMetadata | null>(null);

  useEffect(() => {
    if (!window.openai) return;

    const output = window.openai.toolOutput;
    const meta = window.openai.toolResponseMetadata;

    setToolOutput(output || null);
    setMetadata(meta || null);

    if (output?.error || meta?.error) {
      setViewState('error');
    } else if (meta?.action === 'list') {
      setViewState('list');
    } else if (meta?.action === 'show_ad' && meta.adSession) {
      setViewState('ad');
    } else if (meta?.action === 'payment_complete' && meta.content) {
      setViewState('content');
    } else if (meta?.action === 'access' && meta.content) {
      setViewState('content');
    }
  }, []);

  const handleSelectResource = async (resourceId: string) => {
    if (!window.openai?.callTool) return;

    try {
      await window.openai.callTool('access_premium_resource', {
        resourceId,
        userId: 'chatgpt-user',
      });
    } catch (error) {
      console.error('Failed to access resource:', error);
    }
  };

  const handleAdComplete = () => {
    if (metadata?.paymentRequirements) {
      setViewState('payment');
    }
  };

  const handlePaymentComplete = async (paymentHeader: string) => {
    if (!window.openai?.callTool || !metadata?.adSession) return;

    try {
      await window.openai.callTool('complete_ad_and_pay', {
        sessionId: metadata.adSession.adId,
        resourceId: metadata.resource?.id,
        userId: 'chatgpt-user',
        paymentHeader,
      });
    } catch (error) {
      console.error('Failed to complete payment:', error);
      setViewState('error');
    }
  };

  const handleCancelPayment = () => {
    setViewState('list');
  };

  const isDarkTheme = window.openai?.theme === 'dark';

  return (
    <div className={`widget-container ${isDarkTheme ? 'dark' : 'light'}`}>
      {viewState === 'list' && toolOutput?.resources && (
        <ResourceList
          resources={toolOutput.resources}
          onSelectResource={handleSelectResource}
        />
      )}

      {viewState === 'ad' && metadata?.adSession && (
        <AdViewer
          adSession={metadata.adSession}
          onAdComplete={handleAdComplete}
        />
      )}

      {viewState === 'payment' && metadata?.paymentRequirements && metadata?.resource && (
        <PaymentFlow
          paymentRequirements={metadata.paymentRequirements}
          resourceTitle={metadata.resource.title}
          onPaymentComplete={handlePaymentComplete}
          onCancel={handleCancelPayment}
        />
      )}

      {viewState === 'content' && metadata?.resource && metadata?.content && (
        <ContentViewer
          title={metadata.resource.title}
          content={metadata.content}
          payment={metadata.payment}
        />
      )}

      {viewState === 'error' && (
        <div className="error-view">
          <h3>Error</h3>
          <p>{toolOutput?.error || 'An unexpected error occurred.'}</p>
          <button onClick={() => setViewState('list')}>Back to Resources</button>
        </div>
      )}
    </div>
  );
}
