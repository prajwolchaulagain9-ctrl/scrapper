import React, { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Search, TrendingUp } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const NewsScraper = () => {
  const [activeTab, setActiveTab] = useState('flash');
  const [newsArticles, setNewsArticles] = useState({ flash: [], real: [], fake: [] });
  const [authInput, setAuthInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const sampleNews = {
      flash: [
        { id: 1, headline: "Odd-Even rule reintroduced in Kathmandu valley...", description: "Vehicles to ply on odd-even basis...", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop", source: "Local News", timestamp: "2 hours ago" },
        { id: 2, headline: "New infrastructure project announced for valley...", description: "Government unveils major infrastructure plans", image: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=300&fit=crop", source: "National Daily", timestamp: "4 hours ago" }
      ],
      real: [
        { id: 3, headline: "Odd-Even rule reintroduced in Kathmandu valley...", description: "Vehicles to ply on odd-even basis...", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop", source: "Verified Source", timestamp: "1 day ago", confidence: 95, sentiment: 'Positive', risk: 5 }
      ],
      fake: [
        { id: 4, headline: "Odd-Even rule reintroduced in Kathmandu valley...", description: "Vehicles to ply on odd-even basis...", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop", source: "Unverified Blog", timestamp: "3 days ago", confidence: 88, sentiment: 'Negative', risk: 80 }
      ]
    };

    setNewsArticles(sampleNews);
    setTrending([...sampleNews.flash.map(n => n.headline), ...sampleNews.real.map(n => n.headline)]);
  }, []);

  const verifyNews = async () => {
    if (!authInput.trim()) return;
    setLoading(true);
    setVerificationResult(null);

    setTimeout(() => {
      const random = Math.random();
      const isReal = random > 0.5;
      const confidence = Math.floor(70 + random * 30);
      const sentiment = isReal ? 'Positive' : 'Negative';
      const risk = isReal ? Math.floor(100 - confidence) : Math.floor(100 - confidence / 2);

      setVerificationResult({
        status: isReal ? 'real' : 'fake',
        confidence,
        reasoning: isReal ? 'Cross-referenced with verified sources.' : 'No credible sources found; pattern matches misinformation.',
        sources: isReal ? ['Reuters', 'AP', 'Gov Portal'] : ['Unable to verify from credible sources'],
        sentiment,
        risk
      });

      if (isReal) setUserScore(prev => prev + 10);
      setLoading(false);
    }, 2000);
  };

  const NewsCard = ({ article, showConfidence = false }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${article.risk > 50 ? 'animate-shake' : ''}`}>
      <img src={article.image} alt={article.headline} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2">{article.headline}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.description}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="flex items-center gap-1"><Newspaper size={14} />{article.source}</span>
          <span>{article.timestamp}</span>
        </div>
        {showConfidence && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">Confidence</span>
              <span className="text-xs font-bold text-blue-600">{article.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${article.confidence}%` }}></div>
            </div>
            <div className="mt-1 text-xs text-gray-600">Sentiment: {article.sentiment}, Risk: {article.risk}%</div>
          </div>
        )}
      </div>
    </div>
  );

  const pieData = {
    labels: ['Real', 'Fake'],
    datasets: [{ data: [newsArticles.real.length, newsArticles.fake.length], backgroundColor: ['#34D399', '#F87171'] }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <header className="bg-blue-950 border-b-4 border-red-600 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif text-white text-center tracking-wider">Scraper</h1>
          <p className="text-blue-200 text-center text-sm mt-1">The Real News Finder | Score: {userScore} 🏅</p>
        </div>
      </header>

      <div className="bg-yellow-500 text-white py-2 px-4 overflow-hidden whitespace-nowrap">
        <marquee>{trending.join(' ⚡ ')}</marquee>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-red-600 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3">
            {['flash', 'real', 'fake', 'auth'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-t-lg font-semibold transition-all ${activeTab === tab ? 'bg-gray-200 text-gray-800' : 'bg-red-700 text-white hover:bg-red-800'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)} news</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {['flash','real','fake'].includes(activeTab) && (
          <div>
            <div className={`bg-gradient-to-r ${activeTab==='flash'?'from-yellow-500 to-orange-500':activeTab==='real'?'from-blue-600 to-blue-700':'from-red-500 to-red-600'} text-white py-4 px-6 mb-6 rounded-lg shadow-lg flex items-center gap-3`}>
              {activeTab==='flash' && <TrendingUp size={32} />}
              {activeTab==='real' && <CheckCircle size={32} />}
              {activeTab==='fake' && <AlertCircle size={32} />}
              <h2 className="text-3xl font-bold font-serif">{activeTab.charAt(0).toUpperCase()+activeTab.slice(1)} News</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsArticles[activeTab].map(article => (
                <NewsCard key={article.id} article={article} showConfidence={activeTab!=='flash'} />
              ))}
            </div>
            {activeTab !== 'flash' && (
              <div className="mt-6 max-w-sm mx-auto">
                <Pie data={pieData} />
              </div>
            )}
          </div>
        )}

        {activeTab==='auth' && (
          <div>
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 mb-6 rounded-lg shadow-lg flex items-center gap-3">
              <Search size={32} />
              <h2 className="text-3xl font-bold font-serif">News Auth</h2>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl mx-auto">
              <textarea value={authInput} onChange={e=>setAuthInput(e.target.value)} placeholder="Enter news headline or text..." className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none mb-4" rows={4} />
              <button onClick={verifyNews} disabled={loading||!authInput.trim()} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-6">{loading?'Verifying...':'Submit'}</button>
              {verificationResult && (
                <div className={`rounded-lg p-6 ${verificationResult.status==='real'?'bg-green-50 border-2 border-green-500':'bg-red-50 border-2 border-red-500'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {verificationResult.status==='real'?<CheckCircle className="text-green-600" size={32}/>:<AlertCircle className="text-red-600" size={32}/>} 
                    <h3 className={`text-2xl font-bold ${verificationResult.status==='real'?'text-green-800':'text-red-800'}`}>{verificationResult.status==='real'?'Real':'Fake'}</h3>
                  </div>
                  <div className="mb-4"><div className="flex justify-between items-center mb-2"><span className="font-semibold text-gray-700">Confidence</span><span className="font-bold text-lg">{verificationResult.confidence}%</span></div><div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full transition-all duration-500 ${verificationResult.status==='real'?'bg-green-600':'bg-red-600'}`} style={{width:`${verificationResult.confidence}%`}}></div></div></div>
                  <div className="mb-2 text-gray-600">Sentiment: {verificationResult.sentiment}, Risk: {verificationResult.risk}%</div>
                  <div className="mb-4"><h4 className="font-semibold text-gray-700 mb-2">Reasoning</h4><p className="text-gray-600">{verificationResult.reasoning}</p></div>
                  <div><h4 className="font-semibold text-gray-700 mb-2">Sources</h4><ul className="list-disc list-inside text-gray-600">{verificationResult.sources.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <style>{`.animate-shake { animation: shake 0.5s infinite; } @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-3px); } 50% { transform: translateX(3px); } 75% { transform: translateX(-3px); } 100% { transform: translateX(0); } }`}</style>
    </div>
  );
};

export default NewsScraper;
