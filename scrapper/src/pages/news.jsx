import React, { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Search, TrendingUp, Globe, ShieldAlert, Zap, Loader2 } from 'lucide-react';

const NewsScraper = () => {
  const [activeTab, setActiveTab] = useState('flash');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 🎨 AI IMAGE GENERATOR (The "Search" Replacement)
  // This generates a realistic news image on the fly based on the headline
  const getAIImage = (headline, category) => {
    // 1. Create a clean prompt from the headline
    const prompt = headline
      .replace(/[^\w\s]/gi, '') // Remove special chars
      .split(' ')
      .slice(0, 6) // Take first 6 words for specific context
      .join(' ');

    // 2. Add "News Style" modifiers so it looks like a real photo
    const visualStyle = "realistic editorial news photography, 4k, highly detailed, journalism style";
    
    // 3. Construct the URL (Pollinations generates the image instantly)
    // We add a random seed to ensure different images for similar headlines
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt} ${visualStyle}`)}?nologo=true&private=true&seed=${Math.random()}`;
  };

  // 📡 MAIN FETCH LOGIC
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setArticles([]);
      try {
        let endpoint = 'http://localhost:3000/api/verify-news';
        if (activeTab === 'global') endpoint = 'http://localhost:3000/api/global-news';

        const res = await fetch(endpoint);
        const data = await res.json();
        
        if (Array.isArray(data)) {
            setArticles(data);
        } else {
            console.error("Invalid data format:", data);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'auth') {
      fetchNews();
    }
  }, [activeTab]);

  // 🔍 CLIENT-SIDE FILTERING
  const getDisplayArticles = () => {
    if (!articles) return [];
    if (activeTab === 'global') return articles;
    if (activeTab === 'flash') return articles; 
    if (activeTab === 'real') return articles.filter(a => a.verdict === 'Real');
    if (activeTab === 'fake') return articles.filter(a => ['Fake', 'Misleading', 'Satire', 'Unverified'].includes(a.verdict));
    return articles;
  };

  const displayData = getDisplayArticles();

  // 🤖 MANUAL VERIFICATION
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
      
      const isReal = data.reply?.toLowerCase().includes("real") || data.reply?.toLowerCase().includes("true");
      
      setVerificationResult({
        status: isReal ? 'real' : 'fake',
        confidence: isReal ? 92 : 88,
        reasoning: data.reply || "Analysis complete.",
        sources: ['AI Knowledge Base']
      });
    } catch (e) { console.error(e); } finally { setIsVerifying(false); }
  };

  // 🃏 NEWS CARD COMPONENT
  const NewsCard = ({ article }) => {
    if (!article) return null;

    const isFake = ['Fake', 'Satire', 'Misleading', 'Unverified'].includes(article.verdict);
    const isReal = article.verdict === 'Real';
    
    // ✅ GENERATE IMAGE HERE
    const imageUrl = getAIImage(article.claim || article.title, article.category);
    
    const confidence = article.truthScore || 0;
    const source = article.source_unreliable || article.news_type || "News Feed";

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full border border-slate-100">
        <div className="relative h-48 overflow-hidden bg-slate-200">
          <img 
            src={imageUrl} 
            alt="AI Context" 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            // Fallback if AI generation hangs (rare)
            onError={(e) => e.target.src = "https://images.unsplash.com/photo-1504711432869-efd597cdd045?w=500&q=80"}
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase shadow-md backdrop-blur-sm ${
              isReal ? 'bg-green-600/90' : isFake ? 'bg-red-600/90' : 'bg-yellow-500/90'
            }`}>
              {article.verdict || "Analyzing"}
            </span>
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-xl mb-3 text-slate-800 leading-snug line-clamp-3 hover:text-blue-700 transition-colors">
            <a href={article.url} target="_blank" rel="noreferrer">
                {article.claim || article.title || "News Update"}
            </a>
          </h3>
          
          <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200 flex-1">
            <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">AI Insight</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {article.explanation || "AI is verifying this content against global databases..."}
            </p>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 mt-auto mb-3">
            <span className="flex items-center gap-1.5 font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded">
              <Newspaper size={14} />
              {source}
            </span>
            {article.propaganda_score > 0 && (
               <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                 <ShieldAlert size={14} />
                 Bias: {article.propaganda_score}%
               </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Truth Probability</span>
              <span className={`text-xs font-black ${isReal ? 'text-green-600' : 'text-red-600'}`}>
                {confidence}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isReal ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-slate-200">
      
      {/* Header */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 py-6 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldAlert className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">TRUTH<span className="text-blue-500">GUARD</span></h1>
              <p className="text-[10px] text-slate-400 tracking-[0.2em] uppercase font-bold">AI News Defense System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#1e293b] border-b border-slate-800 sticky top-[89px] z-40 shadow-xl">
        <div className="container mx-auto px-6">
          <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'flash', label: 'Nepal Live', icon: TrendingUp },
              { id: 'global', label: 'Global Verify', icon: Globe },
              { id: 'real', label: 'Verified Real', icon: CheckCircle },
              { id: 'fake', label: 'Fake / Satire', icon: AlertCircle },
              { id: 'auth', label: 'Manual Check', icon: Search }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
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
      <main className="container mx-auto px-6 py-10">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Globe size={20} className="text-slate-600 animate-pulse" />
                </div>
            </div>
            <p className="mt-6 text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">
              {activeTab === 'global' ? "Scanning Global Networks..." : "Connecting to Kathmandu..."}
            </p>
          </div>
        )}

        {!loading && activeTab !== 'auth' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayData.length > 0 ? (
              displayData.map((article, idx) => (
                <NewsCard key={idx} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center py-32 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                <ShieldAlert className="mx-auto text-slate-600 mb-4" size={48} />
                <p className="text-slate-500 text-lg font-medium">No verified intelligence in this sector.</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Auth Tab */}
        {activeTab === 'auth' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Deep Fake Detector</h2>
                <p className="text-slate-400">Paste any suspicious text below for instant AI forensic analysis.</p>
              </div>

              <textarea
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                placeholder="Paste news headline or rumor here..."
                className="w-full p-5 bg-slate-900/50 border-2 border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none text-slate-200 text-lg mb-6 placeholder:text-slate-600 transition-all"
                rows="4"
              />

              <button
                onClick={verifyManualNews}
                disabled={isVerifying || !authInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isVerifying ? <Loader2 className="animate-spin" /> : <Zap size={20} className="group-hover:fill-current" />}
                {isVerifying ? 'Analyzing Patterns...' : 'RUN VERIFICATION SCAN'}
              </button>

              {verificationResult && (
                <div className={`mt-8 rounded-xl p-6 border-l-4 ${
                  verificationResult.status === 'real' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'
                } animate-in slide-in-from-bottom-4 duration-500`}>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {verificationResult.status === 'real' ? (
                      <div className="p-2 bg-green-500/20 rounded-full"><CheckCircle className="text-green-500" size={32} /></div>
                    ) : (
                      <div className="p-2 bg-red-500/20 rounded-full"><AlertCircle className="text-red-500" size={32} /></div>
                    )}
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Analysis Result</p>
                        <h3 className={`text-3xl font-black uppercase ${
                        verificationResult.status === 'real' ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {verificationResult.status}
                        </h3>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700/50">
                    <p className="text-slate-300 leading-relaxed text-sm">{verificationResult.reasoning}</p>
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