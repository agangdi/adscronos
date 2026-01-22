import React from "react";

export default function ApiDataCard({ apiData, onPurchaseClick }) {
  if (!apiData) return null;
  
  return (
    <div className="min-w-[220px] select-none max-w-[220px] w-[65vw] sm:w-[220px] self-stretch flex flex-col">
      <div className="w-full">
        <div
          className="w-full aspect-square rounded-2xl flex items-center justify-center ring ring-black/5 shadow-[0px_2px_6px_rgba(0,0,0,0.06)] p-8"
          style={{
            background: apiData.bgGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {apiData.logo ? (
            <img 
              src={apiData.logo} 
              alt={`${apiData.name} logo`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center text-white">
              <div className="text-6xl font-bold">{apiData.letter || '?'}</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col flex-1">
        <div className="text-base font-medium truncate line-clamp-1">{apiData.name}</div>
        {apiData.subtitle && (
          <div className="text-sm text-black/70 truncate line-clamp-1">{apiData.subtitle}</div>
        )}
        <div className="text-xs mt-1 text-black/60 flex items-center gap-1">
          <span className="font-semibold">{apiData.price}</span>
          <span>· {apiData.category}</span>
          <span>· {apiData.requests}</span>
        </div>
        {apiData.description ? (
          <div className="text-sm mt-2 text-black/80 flex-auto line-clamp-3">
            {apiData.description}
          </div>
        ) : null}
        <div className="mt-5">
          <button
            type="button"
            onClick={onPurchaseClick}
            className="cursor-pointer inline-flex items-center rounded-full bg-[#0066FF] text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 active:opacity-100"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
  );
}
