import React, { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Search, TrendingUp, Globe, ShieldAlert, Zap, Loader2 } from 'lucide-react';

const NewsScraper = () => {
  const [activeTab, setActiveTab] = useState('flash');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authInput, setAuthInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let endpoint = 'http://localhost:3000/api/verify-news';
        if (activeTab === 'global') endpoint = 'http://localhost:3000/api/global-news';

        const res = await fetch(endpoint);
        const data = await res.json();
        if (Array.isArray(data)) setArticles(data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'auth') fetchNews();
  }, [activeTab]);

  const getDisplayArticles = () => {
    if (!articles) return [];
    if (activeTab === 'real') return articles.filter(a => a.verdict === 'Real');
    if (activeTab === 'fake') return articles.filter(a => ['Fake', 'Misleading', 'Satire'].includes(a.verdict));
    return articles;
  };

  const verifyManualNews = async () => {
    if (!authInput.trim()) return;
    setIsVerifying(true);
    try {
      const res = await fetch('http://localhost:3000/api/chat-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Verify: "${authInput}"` })
      });
      const data = await res.json();
      setVerificationResult({
        status: data.reply?.toLowerCase().includes("real") ? 'real' : 'fake',
        reasoning: data.reply
      });
    } catch (e) { console.error(e); } finally { setIsVerifying(false); }
  };

  const NewsCard = ({ article }) => {
    const isFake = ['Fake', 'Satire', 'Misleading'].includes(article.verdict);
    const isReal = article.verdict === 'Real';

    return (
      <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all shadow-xl flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
            isReal ? 'bg-green-500/20 text-green-400' : isFake ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {article.verdict}
          </span>
          <span className="text-slate-500 text-[10px] font-mono">{article.category}</span>
        </div>
        
        <h3 className="font-bold text-lg mb-4 text-white leading-tight">
          <a href={article.url} target="_blank" rel="noreferrer" className="hover:text-blue-400">
            {article.claim}
          </a>
        </h3>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 mb-4 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forensic Evaluation</span>
          </div>
          <p className="text-slate-400 text-sm italic leading-relaxed">
            "{article.explanation}"
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
           <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase">Truth Score</span>
              <span className={`text-lg font-black ${isReal ? 'text-green-400' : 'text-red-400'}`}>{article.truthScore}%</span>
           </div>
           {article.propaganda_score > 30 && (
             <div className="text-right">
               <span className="text-[9px] text-red-500 uppercase font-bold">Bias Warning</span>
               <p className="text-xs text-slate-400">{article.propaganda_score}% Loaded</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <header className="bg-[#1e293b] border-b border-slate-800 py-6 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center gap-4">
          <ShieldAlert className="text-blue-500" size={32} />
          <h1 className="text-2xl font-black tracking-tighter">TRUTH GUARD <span className="text-blue-500 text-sm font-mono ml-2">v2.0_2026</span></h1>
        </div>
      </header>

      <nav className="bg-[#1e293b]/50 border-b border-slate-800 sticky top-[80px] z-40">
        <div className="container mx-auto px-6 flex gap-4 py-3 overflow-x-auto">
          {['flash', 'global', 'real', 'fake', 'auth'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-xs font-mono text-slate-500">SYNCHRONIZING WITH GLOBAL DATABASES...</p>
          </div>
        ) : activeTab === 'auth' ? (
          <div className="max-w-2xl mx-auto bg-[#1e293b] p-8 rounded-2xl border border-slate-700">
            <textarea value={authInput} onChange={(e) => setAuthInput(e.target.value)} placeholder="Enter claim for analysis..." className="w-full bg-slate-900 border-2 border-slate-800 p-4 rounded-xl mb-4 focus:border-blue-500 outline-none" rows="4" />
            <button onClick={verifyManualNews} className="w-full bg-blue-600 py-4 rounded-xl font-bold">RUN FORENSIC SCAN</button>
            {verificationResult && <div className="mt-6 p-4 bg-slate-900 rounded-xl border-l-4 border-blue-500"><p className="text-sm">{verificationResult.reasoning}</p></div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getDisplayArticles().map((art, idx) => <NewsCard key={idx} article={art} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default NewsScraper;