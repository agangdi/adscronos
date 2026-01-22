import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ApiDataCard from "./ApiDataCard";

const API_DATA_ITEMS = [
  {
    id: "cronos-faucet",
    name: "Cronos Faucet",
    subtitle: "Get Cronos Gas",
    logo: "https://cryptologos.cc/logos/cronos-cro-logo.svg",
    price: "Free",
    category: "Testnet",
    requests: "Daily",
    description: "Watch a short sponsored clip to receive testnet gas and start building on Cronos EVM instantly.",
    bgGradient: "linear-gradient(135deg, #002D74 0%, #00A3FF 100%)",
    exampleQuery: "get testnet CRO for 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    mockResponse: "✅ Sent 10 TCRO to your address. Transaction: 0xabc123..."
  },
  {
    id: "cryptocom-vip",
    name: "Crypto.com VIP Access",
    subtitle: "Unlock VIP Rewards",
    logo: "https://cryptologos.cc/logos/crypto-com-coin-cro-logo.svg",
    price: "Premium",
    category: "Exchange",
    requests: "Limited",
    description: "View sponsored content to unlock fee discounts, bonus rewards, or temporary VIP benefits.",
    bgGradient: "linear-gradient(135deg, #002D74 0%, #103F91 100%)",
    exampleQuery: "unlock VIP trading benefits",
    mockResponse: "🎉 VIP Status Activated! Enjoy 0% trading fees for 24 hours and 2x CRO rewards."
  },
  {
    id: "binance-square",
    name: "Binance Square",
    subtitle: "Sponsored Market Insight",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.svg",
    price: "Free",
    category: "Analytics",
    requests: "Unlimited",
    description: "Engage with sponsored crypto insights to unlock advanced charts, signals, or exclusive posts.",
    bgGradient: "linear-gradient(135deg, #F3BA2F 0%, #FCD535 100%)",
    exampleQuery: "show BTC market analysis",
    mockResponse: "📊 BTC Analysis: Strong support at $42k. RSI: 58. Bullish momentum building. Premium signals unlocked."
  },
  {
    id: "financial-times",
    name: "Financial Times",
    subtitle: "Premium Financial Brief",
    logo: "https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1%3Abrand-ft-logo-square-coloured?source=update-logos",
    price: "$9.99",
    category: "News",
    requests: "10/mo",
    description: "Watch sponsored content to unlock premium articles and curated global market analysis.",
    bgGradient: "linear-gradient(135deg, #FFF1E5 0%, #FFE5CC 100%)",
    exampleQuery: "latest global market brief",
    mockResponse: "📰 FT Brief: Global markets rally on Fed signals. Tech stocks lead gains. Full analysis unlocked."
  }
];

const AD_DURATION = 10;
const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:8000';

function App() {
  const apiDataItems = API_DATA_ITEMS;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);
  const [selectedApi, setSelectedApi] = React.useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);
  const [queryInput, setQueryInput] = React.useState("");
  const [showAdModal, setShowAdModal] = React.useState(false);
  const [adCountdown, setAdCountdown] = React.useState(AD_DURATION);
  const [showResult, setShowResult] = React.useState(false);
  const [apiResult, setApiResult] = React.useState("");
  const [adData, setAdData] = React.useState(null);
  const [adStartTime, setAdStartTime] = React.useState(null);
  const [canSkipAd, setCanSkipAd] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePurchaseClick = (apiData) => {
    setSelectedApi(apiData);
    setQueryInput(apiData.exampleQuery || "");
    setShowPurchaseModal(true);
  };

  const reportAdPlayback = async () => {
    if (!adData || !adData.playbackId) return;
    
    const viewDuration = adStartTime ? Date.now() - adStartTime : 0;
    
    try {
      await fetch(`${API_HOST}/api/ads/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playbackId: adData.playbackId,
          status: 'COMPLETED',
          viewDuration: viewDuration,
          metadata: {
            deviceType: /Mobile/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            apiType: selectedApi?.id
          }
        }),
      });
      console.log('Ad playback reported successfully');
    } catch (error) {
      console.error('Error reporting ad playback:', error);
    }
  };

  const processApiQuery = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_HOST}/api/process-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiType: selectedApi?.id || 'unknown',
          userInput: queryInput,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setApiResult(result.content || 'Success');
      } else {
        setApiResult(result.message || 'Failed to process request');
      }
      
      setIsProcessing(false);
      setShowResult(true);
    } catch (error) {
      console.error('Error calling API:', error);
      setApiResult('Error: Failed to connect to server. Please ensure the server is running.');
      setIsProcessing(false);
      setShowResult(true);
    }
  };

  const handleSkipAd = React.useCallback(() => {
    setShowAdModal(false);
    setCanSkipAd(false);
    reportAdPlayback();
    processApiQuery();
  }, [adData, adStartTime, selectedApi, queryInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowPurchaseModal(false);
    
    // Fetch ad from backend
    try {
      const response = await fetch(`${API_HOST}/api/ads/fetch?type=IFRAME`);
      const data = await response.json();
      
      if (data.playbackId && data.ad) {
        setAdData(data);
        setAdStartTime(Date.now());
        setShowAdModal(true);
        setAdCountdown(AD_DURATION);
        setCanSkipAd(false);
      } else {
        console.error('Invalid ad data received:', data);
        processApiQuery();
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      processApiQuery();
    }
  };

  React.useEffect(() => {
    if (showAdModal && adCountdown > 0) {
      const timer = setTimeout(() => {
        setAdCountdown(adCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showAdModal && adCountdown === 0) {
      if (adData?.ad?.type === 'IFRAME') {
        setCanSkipAd(true);
      } else {
        handleSkipAd();
      }
    }
  }, [showAdModal, adCountdown, adData?.ad?.type, handleSkipAd]);

  React.useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="antialiased relative w-full text-black py-5 bg-white">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 max-sm:mx-5 items-stretch">
          {apiDataItems.map((apiData) => (
            <ApiDataCard 
              key={apiData.id} 
              apiData={apiData}
              onPurchaseClick={() => handlePurchaseClick(apiData)}
            />
          ))}
        </div>
      </div>
      {/* Edge gradients */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 left-0 w-3 z-[5] transition-opacity duration-200 " +
          (canPrev ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-l border-black/15 bg-gradient-to-r from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 right-0 w-3 z-[5] transition-opacity duration-200 " +
          (canNext ? "opacity-100" : "opacity-0")
        }
      >
        <div
          className="h-full w-full border-r border-black/15 bg-gradient-to-l from-black/10 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, white 30%, white 70%, transparent 100%)",
          }}
        />
      </div>
      {canPrev && (
        <button
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white"
          onClick={() => emblaApi && emblaApi.scrollPrev()}
          type="button"
        >
          <ArrowLeft
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}
      {canNext && (
        <button
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white text-black shadow-lg ring ring-black/5 hover:bg-white"
          onClick={() => emblaApi && emblaApi.scrollNext()}
          type="button"
        >
          <ArrowRight
            strokeWidth={1.5}
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        </button>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedApi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">{selectedApi.name}</h2>
            <p className="text-lg font-semibold text-blue-600 mb-4">{selectedApi.price}</p>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Enter your query:
              </label>
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={selectedApi.exampleQuery}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad Modal */}
      {showAdModal && adData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg max-w-3xl w-full mx-4 shadow-2xl overflow-hidden">
            {/* Ad Content */}
            <div className="relative">
              {adData.ad.type === 'IFRAME' ? (
                // YouTube iframe with autoplay
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`${adData.ad.assetUrl}${adData.ad.assetUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&rel=0`}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={adData.ad.name || "Advertisement"}
                  />
                  
                  {/* Overlay controls - YouTube style */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                    <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                      AD
                    </span>
                    {adData.ad.advertiser?.name && (
                      <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {adData.ad.advertiser.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Bottom right controls */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                    {adData.ad.clickUrl && (
                      <a 
                        href={adData.ad.clickUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white/90 hover:bg-white px-3 py-1.5 rounded text-xs font-semibold text-gray-800 shadow-lg transition-colors"
                      >
                        Learn More
                      </a>
                    )}
                    
                    {/* Countdown or Skip button */}
                    {canSkipAd ? (
                      <button
                        onClick={handleSkipAd}
                        className="bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded text-xs font-semibold shadow-lg transition-colors"
                      >
                        Skip Ad →
                      </button>
                    ) : (
                      <div className="bg-black/80 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-lg">
                        {adCountdown}s
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50 z-20">
                    <div
                      className="h-full bg-red-600 transition-all duration-1000"
                      style={{ width: `${((AD_DURATION - adCountdown) / AD_DURATION) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                // Image ad
                <div className="relative">
                  <img 
                    src={adData.ad.assetUrl} 
                    alt={adData.ad.name}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23ddd" width="800" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="24"%3EAd Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {adData.ad.clickUrl && (
                    <a 
                      href={adData.ad.clickUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 cursor-pointer"
                      aria-label="Visit advertiser"
                    />
                  )}
                  
                  {/* Progress bar for image ads */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                    <div
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${((AD_DURATION - adCountdown) / AD_DURATION) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Processing Your Request</h2>
            <p className="text-gray-600 mb-4">
              {selectedApi?.name ? `Calling ${selectedApi.name}...` : 'Processing...'}
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                Please wait while we fetch your data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-green-600 flex-shrink-0">API Response</h2>
            <div className="bg-gray-100 rounded-lg p-4 mb-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">{apiResult}</p>
            </div>
            <button
              onClick={() => {
                setShowResult(false);
                setSelectedApi(null);
                setQueryInput("");
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex-shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("api-data-carousel-root")).render(<App />);
