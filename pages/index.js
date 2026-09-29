import React, { useState } from 'react';

// --- DATASTRUKTUR ---
const INITIAL_SUB_MATCHES = [
  { id: 'S1', name: 'Singel 1', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S2', name: 'Singel 2', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'D1', name: 'Dubbel 1', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S3', name: 'Singel 3', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S4', name: 'Singel 4', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S5', name: 'Singel 5', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S6', name: 'Singel 6', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'D2', name: 'Dubbel 2', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S7', name: 'Singel 7', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'S8', name: 'Singel 8', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' },
  { id: 'AD', name: 'Avgörande Dubbel', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, status: 'pending' }
];

// --- 1. ADMIN VY ---
function AdminView({ matchData, setMatchData }) {
  const handleTeamChange = (e) => {
    setMatchData({ ...matchData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (id, field, value) => {
    const updated = matchData.subMatches.map(sm => 
      sm.id === id ? { ...sm, [field]: value } : sm
    );
    setMatchData({ ...matchData, subMatches: updated });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-400">Admin - Laguppställning</h1>
      <div className="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded-lg">
        <div>
          <label className="block text-sm text-slate-400">Hemmalag</label>
          <input name="homeTeam" value={matchData.homeTeam} onChange={handleTeamChange} className="w-full bg-slate-700 p-2 rounded text-lg font-bold mt-1 text-white" />
        </div>
        <div>
          <label className="block text-sm text-slate-400">Bortalag</label>
          <input name="awayTeam" value={matchData.awayTeam} onChange={handleTeamChange} className="w-full bg-slate-700 p-2 rounded text-lg font-bold mt-1 text-white" />
        </div>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg space-y-3">
        {matchData.subMatches.map((sm) => (
          <div key={sm.id} className="flex items-center gap-2 border-b border-slate-700 pb-2">
            <span className="w-12 font-bold text-yellow-500">{sm.id}</span>
            <input placeholder={`Spelare ${matchData.homeTeam}`} value={sm.homePlayer} onChange={(e) => handlePlayerChange(sm.id, 'homePlayer', e.target.value)} className="flex-1 bg-slate-700 p-2 rounded text-sm text-white" />
            <span className="text-slate-500">vs</span>
            <input placeholder={`Spelare ${matchData.awayTeam}`} value={sm.awayPlayer} onChange={(e) => handlePlayerChange(sm.id, 'awayPlayer', e.target.value)} className="flex-1 bg-slate-700 p-2 rounded text-sm text-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 2. DOMAR VY ---
function DartScorer({ match, homeTeam, awayTeam, onBack, onSave }) {
  const [homeScore, setHomeScore] = useState(501);
  const [awayScore, setAwayScore] = useState(501);
  const [homeLegs, setHomeLegs] = useState(0);
  const [awayLegs, setAwayLegs] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [turn, setTurn] = useState('home');
  const [performances, setPerformances] = useState([]);

  const handleNumClick = (num) => setInputVal(prev => prev + num);
  
  const handleEnterScore = () => {
    const score = parseInt(inputVal, 10);
    if (isNaN(score) || score > 180) return;

    if (score === 180) {
      setPerformances(prev => [...prev, { player: turn === 'home' ? match.homePlayer : match.awayPlayer, type: '180' }]);
    }

    if (turn === 'home') {
      const newScore = homeScore - score;
      if (newScore === 0) { setHomeLegs(l => l + 1); setHomeScore(501); setAwayScore(501); } 
      else if (newScore > 1) { setHomeScore(newScore); }
      setTurn('away');
    } else {
      const newScore = awayScore - score;
      if (newScore === 0) { setAwayLegs(l => l + 1); setHomeScore(501); setAwayScore(501); } 
      else if (newScore > 1) { setAwayScore(newScore); }
      setTurn('home');
    }
    setInputVal('');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 p-4 rounded-xl space-y-4">
      <button onClick={onBack} className="text-xs text-slate-400">← Tillbaka</button>
      <div className="grid grid-cols-2 gap-2 text-center bg-slate-900 p-3 rounded-lg">
        <div className={turn === 'home' ? 'ring-2 ring-green-500 rounded p-1' : 'p-1'}>
          <div className="text-xs text-slate-400">{match.homePlayer || homeTeam}</div>
          <div className="text-5xl font-extrabold text-green-400">{homeScore}</div>
          <div className="text-sm mt-1">Legs: <span className="font-bold">{homeLegs}</span></div>
        </div>
        <div className={turn === 'away' ? 'ring-2 ring-green-500 rounded p-1' : 'p-1'}>
          <div className="text-xs text-slate-400">{match.awayPlayer || awayTeam}</div>
          <div className="text-5xl font-extrabold text-green-400">{awayScore}</div>
          <div className="text-sm mt-1">Legs: <span className="font-bold">{awayLegs}</span></div>
        </div>
      </div>
      <div className="bg-slate-900 p-3 rounded text-right text-3xl font-mono h-14 text-yellow-400">{inputVal || '0'}</div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => handleNumClick(n.toString())} className="bg-slate-700 hover:bg-slate-600 p-4 text-2xl font-bold rounded">{n}</button>
        ))}
        <button onClick={() => setInputVal('')} className="bg-red-800 hover:bg-red-700 p-4 text-lg font-bold rounded">C</button>
        <button onClick={() => handleNumClick('0')} className="bg-slate-700 hover:bg-slate-600 p-4 text-2xl font-bold rounded">0</button>
        <button onClick={handleEnterScore} className="bg-green-600 hover:bg-green-500 p-4 text-xl font-bold rounded">OK</button>
      </div>
      <button onClick={() => { onSave({ ...match, homeScore: homeLegs, awayScore: awayLegs, status: 'completed' }, performances); onBack(); }} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold mt-4">
        Spara & Avsluta
      </button>
    </div>
  );
}

function RefereeView({ matchData, activeSubMatchId, setActiveSubMatchId, onSaveMatch }) {
  const activeMatch = matchData.subMatches.find(m => m.id === activeSubMatchId);
  if (!activeMatch) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {matchData.subMatches.map((sm) => (
          <button key={sm.id} onClick={() => setActiveSubMatchId(sm.id)} className="bg-slate-800 p-4 rounded-lg text-left flex justify-between items-center border border-slate-700">
            <div><span className="font-bold text-yellow-500 mr-2">{sm.id}</span><span>{sm.homePlayer || 'Hemmalag'} vs {sm.awayPlayer || 'Bortalag'}</span></div>
            <span className={`px-2 py-1 rounded text-xs ${sm.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-slate-600'}`}>
              {sm.status === 'completed' ? `${sm.homeScore} - ${sm.awayScore}` : 'Välj'}
            </span>
          </button>
        ))}
      </div>
    );
  }
  return <DartScorer match={activeMatch} homeTeam={matchData.homeTeam} awayTeam={matchData.awayTeam} onBack={() => setActiveSubMatchId(null)} onSave={onSaveMatch} />;
}

// --- 3. PUBLIK VY ---
function PublicView({ matchData }) {
  const totalHomeScore = matchData.subMatches.reduce((acc, sm) => acc + (sm.homeScore > sm.awayScore ? 1 : 0), 0);
  const totalAwayScore = matchData.subMatches.reduce((acc, sm) => acc + (sm.awayScore > sm.homeScore ? 1 : 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center shadow-2xl">
        <div className="flex justify-between items-center my-4">
          <div className="w-2/5 text-right"><h2 className="text-2xl md:text-4xl font-black">{matchData.homeTeam}</h2></div>
          <div className="w-1/5 bg-slate-900 py-2 px-4 rounded-lg text-3xl md:text-5xl font-black text-yellow-400">{totalHomeScore} - {totalAwayScore}</div>
          <div className="w-2/5 text-left"><h2 className="text-2xl md:text-4xl font-black">{matchData.awayTeam}</h2></div>
        </div>
      </div>
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr><th className="p-3">Match</th><th className="p-3 text-right">{matchData.homeTeam}</th><th className="p-3 text-center">Resultat</th><th className="p-3">{matchData.awayTeam}</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-sm">
            {matchData.subMatches.map((sm) => (
              <tr key={sm.id}>
                <td className="p-3 text-yellow-500 font-bold">{sm.id}</td>
                <td className="p-3 text-right">{sm.homePlayer || '-'}</td>
                <td className="p-3 text-center font-bold">
                  {sm.status === 'completed' ? <span className="text-green-400">{sm.homeScore} - {sm.awayScore}</span> : <span className="text-slate-500">vs</span>}
                </td>
                <td className="p-3">{sm.awayPlayer || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-800 p-4 rounded-xl">
        <h3 className="font-bold text-sm text-slate-400 uppercase mb-2">Prestationer[cite: 1]</h3>
        <div className="flex flex-wrap gap-2">
          {matchData.performances.map((perf, index) => (
            <span key={index} className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">🎯 {perf.player}: {perf.type}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- HUVUDAPPLIKATION ---
export default function Home() {
  const [currentView, setCurrentView] = useState('public');
  const [activeSubMatchId, setActiveSubMatchId] = useState(null);
  const [matchData, setMatchData] = useState({
    homeTeam: 'Hemmalag FC',
    awayTeam: 'Bortalag BK',
    subMatches: INITIAL_SUB_MATCHES,
    performances: []
  });

  const handleUpdateSubMatch = (updatedSubMatch, newPerformances = []) => {
    setMatchData(prev => ({
      ...prev,
      subMatches: prev.subMatches.map(m => m.id === updatedSubMatch.id ? updatedSubMatch : m),
      performances: [...prev.performances, ...newPerformances]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-800 p-3 flex justify-center gap-4 border-b border-slate-700">
        <button onClick={() => setCurrentView('admin')} className={`px-4 py-2 rounded font-bold ${currentView === 'admin' ? 'bg-blue-600' : 'bg-slate-700'}`}>Admin</button>
        <button onClick={() => setCurrentView('referee')} className={`px-4 py-2 rounded font-bold ${currentView === 'referee' ? 'bg-green-600' : 'bg-slate-700'}`}>Domare</button>
        <button onClick={() => setCurrentView('public')} className={`px-4 py-2 rounded font-bold ${currentView === 'public' ? 'bg-purple-600' : 'bg-slate-700'}`}>Publik</button>
      </nav>
      <main className="p-4 max-w-5xl mx-auto">
        {currentView === 'admin' && <AdminView matchData={matchData} setMatchData={setMatchData} />}
        {currentView === 'referee' && <RefereeView matchData={matchData} activeSubMatchId={activeSubMatchId} setActiveSubMatchId={setActiveSubMatchId} onSaveMatch={handleUpdateSubMatch} />}
        {currentView === 'public' && <PublicView matchData={matchData} />}
      </main>
    </div>
  );
}
