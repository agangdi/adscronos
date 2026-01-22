import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ApiDataCard from "./ApiDataCard";

const API_DATA_ITEMS = [
  {
    id: "crypto-api",
    name: "Cryptocurrency API",
    letter: "C",
    price: "$0.1",
    category: "Real-time",
    requests: "Unlimited",
    description: "Real-time address balance and faucet of Cronos chain.",
    bgGradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    exampleQuery: "the CRO balance of 0x34Aa852F352D18423632CFF24695F5D349d0f53f",
    mockResponse: "50 CRO"
  },
  {
    id: "translation-api",
    name: "Translation API",
    letter: "T",
    price: "$15.99",
    category: "Batch",
    requests: "100K chars",
    description: "Neural machine translation supporting 100+ languages with 95%+ accuracy and natural-sounding results.",
    bgGradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    exampleQuery: "translate 'Hello, how are you?' to Spanish",
    mockResponse: "Hola, ¿cómo estás?"
  },
  {
    id: "weather-api",
    name: "Weather API",
    letter: "W",
    price: "Free",
    category: "Real-time",
    requests: "1K/mo",
    description: "Get real-time weather data including temperature, humidity, wind speed, and forecasts for any location worldwide.",
    bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    exampleQuery: "weather in San Francisco",
    mockResponse: "22°C, Partly Cloudy, Humidity: 65%, Wind: 12 km/h"
  },
  {
    id: "stock-api",
    name: "Stock Market API",
    letter: "S",
    price: "$29.99",
    category: "Premium",
    requests: "10K/mo",
    description: "Access real-time stock quotes, historical prices, and market analytics for global exchanges with <50ms latency.",
    bgGradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    exampleQuery: "AAPL stock price",
    mockResponse: "AAPL: $178.45 (+2.34, +1.33%)"
  },
  {
    id: "news-api",
    name: "News API",
    letter: "N",
    price: "$19.99",
    category: "Batch",
    requests: "5K/mo",
    description: "Search millions of news articles from 50,000+ sources worldwide with full-text search and filtering capabilities.",
    bgGradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    exampleQuery: "latest technology news",
    mockResponse: "Found 1,234 articles about technology from the past 24 hours"
  },
  {
    id: "geocoding-api",
    name: "Geocoding API",
    letter: "G",
    price: "Free",
    category: "Batch",
    requests: "2.5K/mo",
    description: "Convert addresses to coordinates and vice versa with 99.9% accuracy. Includes place search and autocomplete.",
    bgGradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    exampleQuery: "coordinates of Times Square, New York",
    mockResponse: "40.7580° N, 73.9855° W"
  },

  {
    id: "image-api",
    name: "Image Recognition API",
    letter: "I",
    price: "$39.99",
    category: "Premium",
    requests: "5K/mo",
    description: "Advanced image recognition and classification using deep learning models. Detect objects, faces, and scenes.",
    bgGradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    exampleQuery: "detect objects in image.jpg",
    mockResponse: "Detected: person (95%), car (87%), tree (76%)"
  },
  {
    id: "sentiment-api",
    name: "Sentiment Analysis API",
    letter: "A",
    price: "$24.99",
    category: "Batch",
    requests: "10K/mo",
    description: "Analyze text sentiment and emotions using advanced NLP. Perfect for social media monitoring and customer feedback.",
    bgGradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    exampleQuery: "analyze sentiment: 'This product is amazing!'",
    mockResponse: "Sentiment: Positive (98% confidence), Emotion: Joy"
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
        setApiResult(result.result || result.message || 'Success');
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
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">{adCountdown}s</div>
              <div className="text-sm text-gray-500">Advertisement</div>
            </div>
            
            {/* Ad Content */}
            <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-4">
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
                  {adData.ad.clickUrl && (
                    <a 
                      href={adData.ad.clickUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-800 shadow-lg z-10"
                    >
                      Learn More →
                    </a>
                  )}
                </div>
              ) : (
                // Image ad
                <>
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
                </>
              )}
            </div>
            
            {/* Ad Info */}
            <div className="text-center text-sm text-gray-600 mb-4">
              {adData.ad.advertiser?.name && (
                <p className="font-medium">{adData.ad.advertiser.name}</p>
              )}
              {adData.ad.name && (
                <p className="text-xs text-gray-500">{adData.ad.name}</p>
              )}
            </div>
            
            {/* Progress Bar and Skip Button */}
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((AD_DURATION - adCountdown) / AD_DURATION) * 100}%` }}
                />
              </div>
              
              {/* Skip Ad Button - only show for iframe ads after countdown */}
              {canSkipAd && adData.ad.type === 'IFRAME' && (
                <button
                  onClick={handleSkipAd}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                >
                  Skip Ad →
                </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-green-600">API Response</h2>
            <div className="bg-gray-100 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              <p className="text-sm font-mono whitespace-pre-wrap break-words">{apiResult}</p>
            </div>
            <button
              onClick={() => {
                setShowResult(false);
                setSelectedApi(null);
                setQueryInput("");
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
