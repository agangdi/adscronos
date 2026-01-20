import React from 'react';
import type { PremiumResource } from '../types';

interface ResourceListProps {
  resources: PremiumResource[];
  onSelectResource: (resourceId: string) => void;
}

export function ResourceList({ resources, onSelectResource }: ResourceListProps) {
  return (
    <div className="resource-list">
      <h2>Premium Resources</h2>
      <div className="resources-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="resource-card">
            <h3>{resource.title}</h3>
            <p className="category">{resource.category}</p>
            <p className="description">{resource.description}</p>
            <div className="resource-footer">
              {resource.requiresPayment && (
                <span className="price">
                  {(parseInt(resource.price) / 1000000).toFixed(2)} USDX
                </span>
              )}
              <button
                className="access-btn"
                onClick={() => onSelectResource(resource.id)}
              >
                {resource.requiresPayment ? 'View Ad & Access' : 'Access Free'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
