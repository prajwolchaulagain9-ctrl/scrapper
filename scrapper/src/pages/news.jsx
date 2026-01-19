import React, { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Search, TrendingUp, Globe, ShieldAlert, Zap, Loader2 } from 'lucide-react';

const NewsScraper = () => {
  const [activeTab, setActiveTab] = useState('flash');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 🖼️ Helper to get relevant images since RSS doesn't always provide them
  const getPlaceholderImage = (category, verdict) => {
    if (verdict === 'Fake' || verdict === 'Satire') return "https://images.unsplash.com/photo-1555861496-0666c8981751?w=500&q=80"; // Warning/Fake
    if (category?.includes('Politics')) return "https://images.unsplash.com/photo-1529101091760-6149390f0792?w=500&q=80";
    if (category?.includes('Economy')) return "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=500&q=80";
    return "https://images.unsplash.com/photo-1504711432869-efd597cdd045?w=500&q=80"; // Default News
  };

  // 📡 MAIN FETCH LOGIC
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setArticles([]);
      try {
        let endpoint = 'http://localhost:3000/api/verify-news'; // Default: Nepal
        if (activeTab === 'global') endpoint = 'http://localhost:3000/api/global-news';

        const res = await fetch(endpoint);
        const data = await res.json();
        setArticles(data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch for news tabs, not the Auth tab
    if (activeTab !== 'auth') {
      fetchNews();
    }
  }, [activeTab]);

  // 🔍 CLIENT-SIDE FILTERING
  const getDisplayArticles = () => {
    if (activeTab === 'global') return articles;
    if (activeTab === 'flash') return articles; // Show all for flash
    if (activeTab === 'real') return articles.filter(a => a.verdict === 'Real');
    if (activeTab === 'fake') return articles.filter(a => a.verdict === 'Fake' || a.verdict === 'Misleading' || a.verdict === 'Satire');
    return articles;
  };

  const displayData = getDisplayArticles();

  // 🤖 MANUAL VERIFICATION (Chat Agent)
  const verifyManualNews = async () => {
    if (!authInput.trim()) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch('http://localhost:3000/api/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Verify this claim: "${authInput}"` })
      });
      const data = await res.json();
      
      // Simple parsing of the chat response for the UI demo
      // In a real app, you'd want the agent to return JSON too
      const isReal = data.reply.toLowerCase().includes("real") || data.reply.toLowerCase().includes("true");
      
      setVerificationResult({
        status: isReal ? 'real' : 'fake',
        confidence: isReal ? 92 : 88,
        reasoning: data.reply,
        sources: ['AI Analysis', 'Knowledge Base']
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  // 🃏 NEWS CARD COMPONENT
  const NewsCard = ({ article }) => {
    const isFake = article.verdict === 'Fake' || article.verdict === 'Satire';
    const isReal = article.verdict === 'Real';
    
    // Map backend data to UI format
    const displayImage = getPlaceholderImage(article.category, article.verdict);
    const confidence = article.truthScore || 0;
    const source = article.source_unreliable || article.news_type || "Reddit Feed";

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
        <div className="relative">
          <img src={displayImage} alt="news" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded text-xs font-bold text-white uppercase shadow-sm ${
              isReal ? 'bg-green-600' : isFake ? 'bg-red-600' : 'bg-yellow-500'
            }`}>
              {article.verdict}
            </span>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2 hover:text-blue-600">
            <a href={article.url} target="_blank" rel="noreferrer">{article.claim}</a>
          </h3>
          
          <div className="bg-slate-50 p-3 rounded-lg mb-3 border border-slate-100 flex-1">
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">
              {article.explanation}
            </p>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
            <span className="flex items-center gap-1 font-semibold text-blue-900">
              <Newspaper size={14} />
              {source}
            </span>
            {article.propaganda_score > 0 && (
               <span className="flex items-center gap-1 text-red-500 font-bold">
                 <ShieldAlert size={14} />
                 Bias: {article.propaganda_score}%
               </span>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">Truth Score</span>
              <span className={`text-xs font-bold ${isReal ? 'text-green-600' : 'text-red-600'}`}>
                {confidence}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${isReal ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 font-sans">
      
      {/* Header */}
      <header className="bg-blue-950 border-b-4 border-red-600 py-6 shadow-2xl">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif text-white tracking-wider flex items-center justify-center gap-3">
            <ShieldAlert className="text-red-500" size={36} />
            TRUTH<span className="text-red-500">GUARD</span>
          </h1>
          <p className="text-blue-200 text-sm mt-1 uppercase tracking-[0.3em]">Global Intelligence Node</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-red-600 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {[
              { id: 'flash', label: 'Nepal Live', icon: TrendingUp },
              { id: 'global', label: 'Global Verify', icon: Globe }, // 🌍 NEW TAB
              { id: 'real', label: 'Verified Real', icon: CheckCircle },
              { id: 'fake', label: 'Fake / Satire', icon: AlertCircle },
              { id: 'auth', label: 'Manual Check', icon: Search }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 shadow-inner'
                    : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
            <p className="text-blue-200 font-mono text-sm animate-pulse">
              {activeTab === 'global' ? "CROSS-REFERENCING GLOBAL SOURCES..." : "SCANNING NEPAL NETWORKS..."}
            </p>
          </div>
        )}

        {/* News Grid (Flash, Global, Real, Fake) */}
        {!loading && activeTab !== 'auth' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayData.length > 0 ? (
              displayData.map((article, idx) => (
                <NewsCard key={idx} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white/10 rounded-xl border-2 border-dashed border-white/20">
                <p className="text-blue-200 text-lg">No active signals found in this sector.</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Auth Tab */}
        {activeTab === 'auth' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Manual Fact Checker</h2>
                <p className="text-gray-500">Paste any headline or rumor below to cross-reference with our AI database.</p>
              </div>

              <textarea
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                placeholder="Ex: 'Government just banned all motorcycles in Kathmandu...'"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700 text-lg mb-6 shadow-inner"
                rows="3"
              />

              <button
                onClick={verifyManualNews}
                disabled={isVerifying || !authInput.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                {isVerifying ? 'Running AI Diagnostics...' : 'VERIFY CLAIM NOW'}
              </button>

              {/* Verification Result */}
              {verificationResult && (
                <div className={`mt-8 rounded-xl p-6 border-l-8 ${
                  verificationResult.status === 'real' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                } animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {verificationResult.status === 'real' ? (
                      <CheckCircle className="text-green-600" size={32} />
                    ) : (
                      <AlertCircle className="text-red-600" size={32} />
                    )}
                    <h3 className={`text-2xl font-bold uppercase ${
                      verificationResult.status === 'real' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Verdict: {verificationResult.status}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-700">AI Confidence</span>
                        <span className="font-bold text-lg">{verificationResult.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${verificationResult.status === 'real' ? 'bg-green-600' : 'bg-red-600'}`}
                          style={{ width: `${verificationResult.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/50 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Analysis</h4>
                      <p className="text-gray-700 leading-relaxed">{verificationResult.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default NewsScraper;