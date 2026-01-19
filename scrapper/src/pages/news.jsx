import React, { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Search, TrendingUp, ShieldCheck, Zap, Info, ShieldAlert } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const NewsScraper = () => {
  const [activeTab, setActiveTab] = useState('flash');
  const [newsArticles, setNewsArticles] = useState({ flash: [], real: [], fake: [] });
  const [loadingNews, setLoadingNews] = useState(true);
  const [userScore, setUserScore] = useState(0);

  useEffect(() => {
    const fetchLiveNews = async () => {
      setLoadingNews(true);
      try {
        const response = await fetch('http://localhost:3000/api/verify-news');
        const data = await response.json();

        const organized = {
          flash: data.slice(0, 3).map((item, idx) => ({ 
            ...item, 
            id: `f-${idx}`, 
            timestamp: 'LIVE', 
            image: "https://images.unsplash.com/photo-1504711432869-efd597cdd045?w=500&q=80" 
          })),
          real: data.filter(item => item.verdict === 'Real').map((item, idx) => ({ 
            ...item, 
            id: `r-${idx}`, 
            truthScore: 100 - (item.propaganda_score / 2),
            propaganda: item.propaganda_score,
            image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500&q=80" 
          })),
          fake: data.filter(item => item.verdict !== 'Real').map((item, idx) => ({ 
            ...item, 
            id: `fake-${idx}`, 
            truthScore: 100 - item.propaganda_score,
            propaganda: item.propaganda_score,
            image: "https://images.unsplash.com/photo-1585829365234-781fdb09695d?w=500&q=80" 
          }))
        };
        setNewsArticles(organized);
      } catch (error) { console.error(error); } finally { setLoadingNews(false); }
    };
    fetchLiveNews();
  }, []);

  const ScoreBar = ({ label, value, colorClass, isInverse = false }) => {
    // For propaganda, a high value is bad (Red). For truth, a high value is good (Green).
    const percentage = Math.min(Math.max(value, 0), 100);
    const barColor = isInverse 
      ? (percentage > 60 ? 'bg-red-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-green-500')
      : (percentage > 70 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500');

    return (
      <div className="mt-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter mb-1 text-slate-500">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className={`${barColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };

  const NewsCard = ({ article, showScores = false }) => (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
      <div className="relative h-44 overflow-hidden">
        <img src={article.image} alt="news" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase backdrop-blur-md ${article.verdict === 'Real' ? 'bg-green-500/80' : 'bg-red-600/80'}`}>
            {article.verdict || 'Flash'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-md font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{article.claim}</h3>
        <p className="text-slate-500 text-xs mb-4 line-clamp-2">{article.explanation || "No additional context available."}</p>
        
        {showScores && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
            <ScoreBar label="Truth Score" value={article.truthScore} />
            <ScoreBar label="Propaganda Risk" value={article.propaganda} isInverse={true} />
            <div className="flex items-center gap-1.5 pt-1">
              <Info size={12} className="text-slate-400" />
              <span className="text-[9px] text-slate-400 italic font-medium">Verified by TruthGuard Llama-3.3</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={12}/> {article.news_type || 'Social'}</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{article.category || 'General'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">TRUTH<span className="text-blue-600">GUARD</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Citizen Level</p>
                <p className="text-sm font-bold text-slate-700">Verified Reporter <span className="text-blue-600">#{userScore}</span></p>
             </div>
             <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-blue-600 border border-slate-200">🏅</div>
          </div>
        </div>
      </header>

      {/* Marquee Ticker */}
      <div className="bg-blue-600 text-white py-2 overflow-hidden border-y border-blue-700 shadow-inner">
        <div className="flex animate-marquee whitespace-nowrap gap-12 font-bold text-xs uppercase tracking-widest">
          {newsArticles.flash.map((n, i) => <span key={i} className="flex items-center gap-2"><Zap size={14} className="text-yellow-300"/> {n.claim}</span>)}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-10 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
          {['flash', 'real', 'fake'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab} news
            </button>
          ))}
        </div>

        {loadingNews ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="h-12 w-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Analyzing Global Context...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsArticles[activeTab]?.length > 0 ? (
              newsArticles[activeTab].map(article => (
                <NewsCard key={article.id} article={article} showScores={activeTab !== 'flash'} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <ShieldAlert className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-medium">No verified data in this sector yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: 200%;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NewsScraper;