export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/adscronos2_transparent_embedded.svg" alt="X402 Logo" className="h-14 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-white">Adscronos</h1>
                <p className="text-xs text-slate-400">Smart Advertising & Monetization Platform</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#integration" className="hover:text-white transition-colors">Integration</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/login" className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                Sign In
              </a>
              <a href="/dashboard" className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  ChatGPT Tool Integration Support
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                  Powered by Cronos X402
                </div>
              </div>
              
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl">
                Smart Ad Platform
                <br />
                <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  Connecting Advertisers & Publishers
                </span>
              </h1>
              
              <p className="mb-6 text-lg text-slate-300 leading-relaxed">
                Provide multimedia advertising services for advertisers and flexible monetization solutions for publishers.
                Support web, video, image, text ad formats, and ChatGPT tool integration for premium content unlocking.
              </p>

              <div className="mb-8 p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.64v8.55c0 4.55-3.08 8.81-8 9.91-4.92-1.1-8-5.36-8-9.91V7.82l8-3.64z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <h3 className="text-lg font-semibold text-white">Enhanced with Cronos X402 Blockchain Payments</h3>
                </div>
                <p className="text-sm text-slate-300">
                  Utilizing <span className="font-semibold text-blue-400">Cronos X402 protocol</span> for secure, convenient, flexible, and stable payment processing with TCRO cryptocurrency. Low fees and transparent blockchain transactions.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                    <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Advertisers</div>
                    <div className="text-sm text-slate-400">Launch multimedia ads</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Publishers</div>
                    <div className="text-sm text-slate-400">Monetize traffic</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - CTA Buttons */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-semibold text-white">Get Started</h2>
                  <p className="mt-2 text-slate-400">Join thousands of advertisers and publishers</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a 
                      href="/register?type=advertiser" 
                      className="flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Advertiser
                    </a>
                    <a 
                      href="/register?type=publisher" 
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Publisher
                    </a>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-sm text-slate-400">Already have an account? </span>
                    <a href="/login" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                      Sign in here
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Core Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Complete advertising and monetization solutions with multiple ad formats and flexible integration options
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
                <svg className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Multimedia Ad Support</h3>
              <p className="text-slate-400">Support web, video, image, text ad formats to meet different scenario requirements</p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">JavaScript SDK</h3>
              <p className="text-slate-400">Lightweight SDK for one-click integration into any website with event tracking and ad display</p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Real-time Analytics</h3>
              <p className="text-slate-400">Detailed ad performance statistics with real-time monitoring of CTR, conversion rates and key metrics</p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h9a1 1 0 001-1z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Webhook Notifications</h3>
              <p className="text-slate-400">Real-time ad event notifications with custom callback URLs and data formats</p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10">
                <svg className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">ChatGPT Integration</h3>
              <p className="text-slate-400">ChatGPT tool integration for ad-based premium content unlocking mechanism</p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:bg-slate-900/70 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Secure & Reliable</h3>
              <p className="text-slate-400">Enterprise-grade security with API key authentication and encrypted data transmission</p>
            </div>

            {/* Feature 7 - Cronos X402 */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 hover:from-blue-500/20 hover:to-purple-500/20 transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.64v8.55c0 4.55-3.08 8.81-8 9.91-4.92-1.1-8-5.36-8-9.91V7.82l8-3.64z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Cronos X402 Blockchain Payments</h3>
              <p className="text-slate-400">Decentralized payment processing with TCRO cryptocurrency for fast, secure, and transparent transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Quick Integration</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Get started in just a few simple steps - begin your advertising or monetization journey
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Advertisers */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-sm text-sky-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Advertisers
                </div>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-white">Launch Ads</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-400">1</div>
                  <div>
                    <div className="font-medium text-white">Register Advertiser Account</div>
                    <div className="text-sm text-slate-400">Provide basic information to complete registration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-400">2</div>
                  <div>
                    <div className="font-medium text-white">Upload Ad Creatives</div>
                    <div className="text-sm text-slate-400">Support image, video, text and other formats</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-400">3</div>
                  <div>
                    <div className="font-medium text-white">Create Ad Campaigns</div>
                    <div className="text-sm text-slate-400">Set targeting parameters and budget</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-400">4</div>
                  <div>
                    <div className="font-medium text-white">Monitor Performance</div>
                    <div className="text-sm text-slate-400">View real-time analytics reports</div>
                  </div>
                </div>
              </div>
            </div>

            {/* For Publishers */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Publishers
                </div>
              </div>
              <h3 className="mb-4 text-xl font-semibold text-white">Monetize Traffic</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">1</div>
                  <div>
                    <div className="font-medium text-white">Register Publisher Account</div>
                    <div className="text-sm text-slate-400">Provide website information to complete registration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">2</div>
                  <div>
                    <div className="font-medium text-white">Create Ad Units</div>
                    <div className="text-sm text-slate-400">Configure ad placement and display formats</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">3</div>
                  <div>
                    <div className="font-medium text-white">Integrate JavaScript SDK</div>
                    <div className="text-sm text-slate-400">Copy code to your website pages</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">4</div>
                  <div>
                    <div className="font-medium text-white">Start Earning Revenue</div>
                    <div className="text-sm text-slate-400">View revenue statistics and settlements</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950/80 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/adscronos2_transparent_embedded.svg" alt="X402 Logo" className="h-12 w-auto" />
                <div>
                  <div className="font-bold text-white">Adscronos</div>
                  <div className="text-xs text-slate-400">Smart Advertising & Monetization Platform</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-md mb-3">
                Professional advertising platform solutions providing efficient, secure, and easy-to-use advertising and monetization services for advertisers and publishers.
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <span>Secured by Cronos X402 Blockchain</span>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-white">Products</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div><a href="#" className="hover:text-white transition-colors">Ad Campaigns</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Monetization</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Analytics</a></div>
                <div><a href="#" className="hover:text-white transition-colors">API Docs</a></div>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold text-white">Support</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div><a href="#" className="hover:text-white transition-colors">Help Center</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Contact Us</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Terms of Service</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-800/50 pt-8 text-center text-sm text-slate-400">
            © 2024 Adscronos. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
