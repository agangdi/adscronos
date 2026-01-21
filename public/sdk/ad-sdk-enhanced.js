(function() {
  'use strict';

  // Configuration and state management
  const SDK_VERSION = '2.0.0';
  const DEFAULT_CONFIG = {
    apiEndpoint: '/api',
    eventsEndpoint: '/api/events',
    adServingEndpoint: '/api/ad-serving',
    retryAttempts: 3,
    timeout: 10000,
    viewabilityThreshold: 0.5,
    viewabilityDuration: 1000,
    enableFraudDetection: true,
    enableViewabilityTracking: true,
    enableLazyLoading: true,
    enableAdBlockerDetection: true
  };

  const state = {
    appId: null,
    config: { ...DEFAULT_CONFIG },
    adUnits: new Map(),
    activeAds: new Map(),
    eventQueue: [],
    isOnline: navigator.onLine,
    deviceInfo: null,
    userAgent: navigator.userAgent,
    sessionId: generateSessionId(),
    adBlockerDetected: false,
    initialized: false
  };

  // Ad format configurations
  const AD_FORMATS = {
    BANNER: {
      type: 'banner',
      sizes: [[728, 90], [320, 50], [300, 250], [160, 600]],
      defaultSize: [300, 250],
      responsive: true
    },
    VIDEO: {
      type: 'video',
      sizes: [[640, 480], [854, 480], [1280, 720]],
      defaultSize: [640, 480],
      autoplay: false,
      muted: true,
      controls: false
    },
    NATIVE: {
      type: 'native',
      responsive: true,
      elements: ['title', 'description', 'image', 'cta']
    },
    INTERSTITIAL: {
      type: 'interstitial',
      fullscreen: true,
      overlay: true,
      dismissible: true
    }
  };

  // Utility functions
  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function generateRequestId() {
    return 'req_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  // Device and browser detection
  function detectDevice() {
    if (state.deviceInfo) return state.deviceInfo;
    
    const ua = navigator.userAgent;
    const device = {
      type: 'desktop',
      os: 'unknown',
      browser: 'unknown',
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      tablet: /iPad|Android(?!.*Mobile)/i.test(ua),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    if (device.mobile && !device.tablet) device.type = 'mobile';
    else if (device.tablet) device.type = 'tablet';

    // OS detection
    if (/Windows/i.test(ua)) device.os = 'windows';
    else if (/Mac/i.test(ua)) device.os = 'macos';
    else if (/Linux/i.test(ua)) device.os = 'linux';
    else if (/Android/i.test(ua)) device.os = 'android';
    else if (/iOS|iPhone|iPad/i.test(ua)) device.os = 'ios';

    // Browser detection
    if (/Chrome/i.test(ua)) device.browser = 'chrome';
    else if (/Firefox/i.test(ua)) device.browser = 'firefox';
    else if (/Safari/i.test(ua)) device.browser = 'safari';
    else if (/Edge/i.test(ua)) device.browser = 'edge';

    state.deviceInfo = device;
    return device;
  }

  // Ad blocker detection
  function detectAdBlocker() {
    return new Promise((resolve) => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);

      setTimeout(() => {
        const blocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        state.adBlockerDetected = blocked;
        resolve(blocked);
      }, 100);
    });
  }

  // Viewability tracking
  function createViewabilityObserver(element, callback) {
    if (!window.IntersectionObserver) return null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isViewable = entry.intersectionRatio >= state.config.viewabilityThreshold;
        callback(isViewable, entry.intersectionRatio);
      });
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    });

    observer.observe(element);
    return observer;
  }

  // Event tracking and analytics
  function trackEvent(eventData) {
    const event = {
      ...eventData,
      sessionId: state.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: detectDevice(),
      sdkVersion: SDK_VERSION
    };

    state.eventQueue.push(event);
    
    if (state.eventQueue.length >= 10 || eventData.type === 'click') {
      flushEvents();
    }
  }

  function flushEvents() {
    if (state.eventQueue.length === 0) return;

    const events = [...state.eventQueue];
    state.eventQueue = [];

    sendToServer(state.config.eventsEndpoint, {
      appId: state.appId,
      events: events
    }).catch(() => {
      // Re-queue events on failure
      state.eventQueue.unshift(...events);
    });
  }

  // Network utilities
  async function sendToServer(endpoint, data, options = {}) {
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Version': SDK_VERSION,
        'X-Session-ID': state.sessionId
      },
      body: JSON.stringify(data),
      ...options
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), state.config.timeout);

    try {
      const response = await fetch(endpoint, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Ad serving and rendering
  async function requestAd(adUnitId, format = 'banner', targeting = {}) {
    const requestId = generateRequestId();
    
    try {
      const adRequest = {
        appId: state.appId,
        adUnitId,
        format,
        targeting: {
          ...targeting,
          device: detectDevice(),
          url: window.location.href,
          referrer: document.referrer
        },
        requestId,
        sessionId: state.sessionId
      };

      const response = await sendToServer(state.config.adServingEndpoint, adRequest);
      
      if (response.ad) {
        trackEvent({
          type: 'ad_request',
          adUnitId,
          requestId,
          success: true
        });
        return response.ad;
      } else {
        throw new Error('No ad returned');
      }
    } catch (error) {
      trackEvent({
        type: 'ad_request',
        adUnitId,
        requestId,
        success: false,
        error: error.message
      });
      return null;
    }
  }

  // Ad unit management
  class AdUnit {
    constructor(id, element, config = {}) {
      this.id = id;
      this.element = element;
      this.config = { ...AD_FORMATS[config.format?.toUpperCase()] || AD_FORMATS.BANNER, ...config };
      this.currentAd = null;
      this.viewabilityObserver = null;
      this.isViewable = false;
      this.viewabilityTimer = null;
      this.loaded = false;
      this.rendered = false;
    }

    async load(targeting = {}) {
      if (this.loaded) return;

      try {
        const ad = await requestAd(this.id, this.config.type, targeting);
        if (ad) {
          this.currentAd = ad;
          this.loaded = true;
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to load ad:', error);
        return false;
      }
    }

    render() {
      if (!this.currentAd || this.rendered) return false;

      try {
        this.element.innerHTML = '';
        
        switch (this.config.type) {
          case 'banner':
            this.renderBanner();
            break;
          case 'video':
            this.renderVideo();
            break;
          case 'native':
            this.renderNative();
            break;
          case 'interstitial':
            this.renderInterstitial();
            break;
          default:
            this.renderBanner();
        }

        this.setupViewabilityTracking();
        this.setupEventListeners();
        this.rendered = true;

        trackEvent({
          type: 'impression',
          adUnitId: this.id,
          adId: this.currentAd.id,
          format: this.config.type
        });

        return true;
      } catch (error) {
        console.error('Failed to render ad:', error);
        return false;
      }
    }

    renderBanner() {
      const container = document.createElement('div');
      container.className = 'x402-banner-ad';
      container.style.cssText = `
        position: relative;
        width: ${this.config.width || this.config.defaultSize[0]}px;
        height: ${this.config.height || this.config.defaultSize[1]}px;
        overflow: hidden;
        border-radius: 8px;
      `;

      if (this.currentAd.imageUrl) {
        const img = document.createElement('img');
        img.src = this.currentAd.imageUrl;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        container.appendChild(img);
      } else if (this.currentAd.htmlContent) {
        container.innerHTML = this.currentAd.htmlContent;
      }

      this.element.appendChild(container);
    }

    renderVideo() {
      const video = document.createElement('video');
      video.src = this.currentAd.videoUrl;
      video.style.cssText = 'width: 100%; height: 100%;';
      video.muted = this.config.muted;
      video.controls = this.config.controls;
      video.autoplay = this.config.autoplay;

      this.element.appendChild(video);
    }

    renderNative() {
      const container = document.createElement('div');
      container.className = 'x402-native-ad';
      
      const template = `
        <div class="native-ad-container">
          ${this.currentAd.title ? `<h3 class="native-title">${this.currentAd.title}</h3>` : ''}
          ${this.currentAd.description ? `<p class="native-description">${this.currentAd.description}</p>` : ''}
          ${this.currentAd.imageUrl ? `<img class="native-image" src="${this.currentAd.imageUrl}" alt="">` : ''}
          ${this.currentAd.ctaText ? `<button class="native-cta">${this.currentAd.ctaText}</button>` : ''}
        </div>
      `;
      
      container.innerHTML = template;
      this.element.appendChild(container);
    }

    renderInterstitial() {
      const overlay = document.createElement('div');
      overlay.className = 'x402-interstitial-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const container = document.createElement('div');
      container.className = 'x402-interstitial-content';
      container.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
        background: white;
        border-radius: 12px;
        overflow: hidden;
      `;

      if (this.config.dismissible) {
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          z-index: 1;
        `;
        closeBtn.onclick = () => this.dismiss();
        container.appendChild(closeBtn);
      }

      // Add ad content
      if (this.currentAd.imageUrl) {
        const img = document.createElement('img');
        img.src = this.currentAd.imageUrl;
        img.style.cssText = 'width: 100%; height: auto;';
        container.appendChild(img);
      }

      overlay.appendChild(container);
      document.body.appendChild(overlay);
      this.overlayElement = overlay;
    }

    setupViewabilityTracking() {
      if (!state.config.enableViewabilityTracking) return;

      this.viewabilityObserver = createViewabilityObserver(this.element, (isViewable, ratio) => {
        if (isViewable && !this.isViewable) {
          this.isViewable = true;
          this.viewabilityTimer = setTimeout(() => {
            trackEvent({
              type: 'viewable',
              adUnitId: this.id,
              adId: this.currentAd?.id,
              viewabilityRatio: ratio
            });
          }, state.config.viewabilityDuration);
        } else if (!isViewable && this.isViewable) {
          this.isViewable = false;
          if (this.viewabilityTimer) {
            clearTimeout(this.viewabilityTimer);
            this.viewabilityTimer = null;
          }
        }
      });
    }

    setupEventListeners() {
      const clickableElement = this.element.querySelector('img, video, .native-cta, .x402-interstitial-content');
      if (clickableElement && this.currentAd.clickUrl) {
        clickableElement.style.cursor = 'pointer';
        clickableElement.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleClick();
        });
      }
    }

    handleClick() {
      trackEvent({
        type: 'click',
        adUnitId: this.id,
        adId: this.currentAd?.id,
        clickUrl: this.currentAd?.clickUrl
      });

      if (this.currentAd?.clickUrl) {
        window.open(this.currentAd.clickUrl, '_blank');
      }
    }

    dismiss() {
      if (this.overlayElement) {
        document.body.removeChild(this.overlayElement);
        this.overlayElement = null;
      }
      
      trackEvent({
        type: 'dismiss',
        adUnitId: this.id,
        adId: this.currentAd?.id
      });
    }

    destroy() {
      if (this.viewabilityObserver) {
        this.viewabilityObserver.disconnect();
      }
      if (this.viewabilityTimer) {
        clearTimeout(this.viewabilityTimer);
      }
      if (this.overlayElement) {
        this.dismiss();
      }
      this.element.innerHTML = '';
      state.adUnits.delete(this.id);
    }
  }

  // Public API
  const X402AdSDK = {
    version: SDK_VERSION,

    init(config = {}) {
      if (state.initialized) {
        console.warn('X402 Ad SDK already initialized');
        return;
      }

      state.appId = config.appId;
      state.config = { ...state.config, ...config };
      state.initialized = true;

      // Initialize device detection
      detectDevice();

      // Setup ad blocker detection
      if (state.config.enableAdBlockerDetection) {
        detectAdBlocker();
      }

      // Setup event flushing
      setInterval(flushEvents, 5000);

      // Setup online/offline detection
      window.addEventListener('online', () => {
        state.isOnline = true;
        flushEvents();
      });
      window.addEventListener('offline', () => {
        state.isOnline = false;
      });

      // Setup page visibility tracking
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          flushEvents();
        }
      });

      // Setup beforeunload event
      window.addEventListener('beforeunload', flushEvents);

      console.log('X402 Ad SDK initialized', { version: SDK_VERSION, appId: state.appId });
    },

    createAdUnit(id, element, config = {}) {
      if (!state.initialized) {
        throw new Error('SDK not initialized. Call init() first.');
      }

      if (typeof element === 'string') {
        element = document.getElementById(element) || document.querySelector(element);
      }

      if (!element) {
        throw new Error('Ad unit element not found');
      }

      const adUnit = new AdUnit(id, element, config);
      state.adUnits.set(id, adUnit);
      return adUnit;
    },

    async loadAd(adUnitId, targeting = {}) {
      const adUnit = state.adUnits.get(adUnitId);
      if (!adUnit) {
        throw new Error(`Ad unit ${adUnitId} not found`);
      }

      const loaded = await adUnit.load(targeting);
      if (loaded) {
        adUnit.render();
      }
      return loaded;
    },

    destroyAdUnit(adUnitId) {
      const adUnit = state.adUnits.get(adUnitId);
      if (adUnit) {
        adUnit.destroy();
      }
    },

    // Legacy compatibility
    showAd(options = {}) {
      const adUnitId = options.adUnitId || 'legacy';
      const element = document.createElement('div');
      document.body.appendChild(element);

      const adUnit = this.createAdUnit(adUnitId, element, {
        format: 'interstitial',
        ...options
      });

      return this.loadAd(adUnitId, options.targeting);
    },

    // Utility methods
    getDeviceInfo: () => detectDevice(),
    isAdBlockerDetected: () => state.adBlockerDetected,
    getSessionId: () => state.sessionId,
    flushEvents,
    
    // Configuration
    setConfig(newConfig) {
      state.config = { ...state.config, ...newConfig };
    },

    getConfig() {
      return { ...state.config };
    }
  };

  // Auto-initialization from script attributes
  function autoInit() {
    const script = document.currentScript;
    if (script) {
      const appId = script.getAttribute('data-app-id');
      const endpoint = script.getAttribute('data-endpoint');
      
      if (appId) {
        X402AdSDK.init({
          appId,
          apiEndpoint: endpoint || DEFAULT_CONFIG.apiEndpoint
        });
      }
    }
  }

  // Export to global scope
  window.X402AdSDK = X402AdSDK;
  window.x402Ad = X402AdSDK; // Legacy compatibility

  // Auto-initialize if script has data attributes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
