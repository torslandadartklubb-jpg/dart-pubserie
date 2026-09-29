import React, { useState, useEffect } from "react";
import Head from "next/head";

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("domare"); // 'domare' | 'publik'
  const [selectedMatchId, setSelectedMatchId] = useState("S1");

  // Matchstruktur med tydliga spelarnamn för både singel och dubbel
  const [matches, setMatches] = useState([
    // Block 1: Singlar S1-S3
    { id: "S1", type: "singel", block: 1, player1: "Spelare A1", player2: "Spelare B1", score1: 0, score2: 0, completed: false, winner: null },
    { id: "S2", type: "singel", block: 1, player1: "Spelare A2", player2: "Spelare B2", score1: 0, score2: 0, completed: false, winner: null },
    { id: "S3", type: "singel", block: 1, player1: "Spelare A3", player2: "Spelare B3", score1: 0, score2: 0, completed: false, winner: null },

    // Block 2: Dubblar D1-D2
    { id: "D1", type: "dubbel", block: 2, player1: "Spelare A1 & A2", player2: "Spelare B1 & B2", p1List: ["Spelare A1", "Spelare A2"], p2List: ["Spelare B1", "Spelare B2"], score1: 0, score2: 0, completed: false, winner: null },
    { id: "D2", type: "dubbel", block: 2, player1: "Spelare A3 & A4", player2: "Spelare B3 & B4", p1List: ["Spelare A3", "Spelare A4"], p2List: ["Spelare B3", "Spelare B4"], score1: 0, score2: 0, completed: false, winner: null },

    // Block 3: Singlar S4-S7
    { id: "S4", type: "singel", block: 3, player1: "Spelare A1", player2: "Spelare B2", score1: 0, score2: 0, completed: false, winner: null },
    { id: "S5", type: "singel", block: 3, player1: "Spelare A2", player2: "Spelare B3", score1: 0, score2: 0, completed: false, winner: null },
    { id: "S6", type: "singel", block: 3, player1: "Spelare A3", player2: "Spelare B4", score1: 0, score2: 0, completed: false, winner: null },
    { id: "S7", type: "singel", block: 3, player1: "Spelare A4", player2: "Spelare B1", score1: 0, score2: 0, completed: false, winner: null },

    // Block 4: Singel S8 & Avgörande Dubbel AD
    { id: "S8", type: "singel", block: 4, player1: "Spelare A4", player2: "Spelare B4", score1: 0, score2: 0, completed: false, winner: null },
    { id: "AD", type: "dubbel", block: 4, player1: "Valfritt Par A", player2: "Valfritt Par B", p1List: ["Spelare A (AD1)", "Spelare A (AD2)"], p2List: ["Spelare B (AD1)", "Spelare B (AD2)"], score1: 0, score2: 0, completed: false, winner: null }
  ]);

  // Prestationer i realtid
  const [achievements, setAchievements] = useState([]);
  const [newAchPlayer, setNewAchPlayer] = useState("");
  const [newAchType, setNewAchType] = useState("180");
  const [newAchValue, setNewAchValue] = useState("");

  // Synkning med localStorage
  useEffect(() => {
    const savedMatches = localStorage.getItem("dart_matches");
    const savedAchievements = localStorage.getItem("dart_achievements");
    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedAchievements) setAchievements(JSON.parse(savedAchievements));

    const handleStorage = (e) => {
      if (e.key === "dart_matches" && e.newValue) setMatches(JSON.parse(e.newValue));
      if (e.key === "dart_achievements" && e.newValue) setAchievements(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateLocalStorage = (newMatches, newAchievements) => {
    if (newMatches) {
      setMatches(newMatches);
      localStorage.setItem("dart_matches", JSON.stringify(newMatches));
    }
    if (newAchievements) {
      setAchievements(newAchievements);
      localStorage.setItem("dart_achievements", JSON.stringify(newAchievements));
    }
  };

  // --- HANDLERS ---
  const handleScoreChange = (matchId, p1Score, p2Score) => {
    const updated = matches.map((m) => {
      if (m.id === matchId) {
        let winner = null;
        let completed = false;
        if (p1Score >= 2) { winner = 1; completed = true; }
        else if (p2Score >= 2) { winner = 2; completed = true; }
        return { ...m, score1: p1Score, score2: p2Score, completed, winner };
      }
      return m;
    });
    updateLocalStorage(updated, null);
  };

  const handleAddAchievement = (e) => {
    e.preventDefault();
    if (!newAchPlayer) return;
    const item = {
      id: Date.now(),
      matchId: selectedMatchId,
      player: newAchPlayer,
      type: newAchType,
      value: newAchValue ? newAchValue : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [item, ...achievements];
    updateLocalStorage(null, updated);
    setNewAchValue("");
  };

  const currentMatch = matches.find((m) => m.id === selectedMatchId);

  // Beräkna totalställning
  const totalScoreA = matches.reduce((acc, m) => acc + (m.winner === 1 ? 1 : 0), 0);
  const totalScoreB = matches.reduce((acc, m) => acc + (m.winner === 2 ? 1 : 0), 0);

  // Hjälpfunktion för namn-styling
  const renderPlayerName = (name, isWinner, isLoser) => {
    if (isWinner) {
      return <div className="text-lg font-bold text-green-400 flex items-center gap-1"><span>{name}</span> <span>🏆</span></div>;
    }
    if (isLoser) {
      return <div className="text-xs text-red-400 opacity-75">{name}</div>;
    }
    return <div className="text-base font-medium text-white">{name}</div>;
  };

  // Lista av alla spelares namn för den valda matchen
  const getSelectablePlayers = (match) => {
    if (!match) return [];
    if (match.p1List && match.p2List) {
      return [...match.p1List, ...match.p2List];
    }
    return [match.player1, match.player2];
  };

  return (
    <>
      <Head>
        <title>Dart Protokoll</title>
        {/* Importera Tailwind CSS direkt i index.js så att allt stajlas automatiskt utan extra filer */}
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
        {/* HEADER / NAVIGATION */}
        <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 border-b border-slate-700 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-amber-400">DART PROTOKOLL</h1>
            <p className="text-xs text-slate-400">Matchvy & Live-uppdatering</p>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab("domare")}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                activeTab === "domare" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Domarvy
            </button>
            <button
              onClick={() => setActiveTab("publik")}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                activeTab === "publik" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Publikvy (Live)
            </button>
          </div>
        </header>

        {/* TOTALSTÄLLNING BAR */}
        <section className="max-w-5xl mx-auto my-6 bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center shadow-lg">
          <div className="text-center flex-1">
            <div className="text-xs text-slate-400 uppercase tracking-widest">Hemma</div>
            <div className="text-xl md:text-2xl font-extrabold text-white">Lag A</div>
          </div>
          <div className="bg-slate-950 px-6 py-2 rounded-lg border border-slate-800 flex items-center gap-3">
            <span className="text-3xl font-black text-amber-400">{totalScoreA}</span>
            <span className="text-slate-600 font-bold">-</span>
            <span className="text-3xl font-black text-amber-400">{totalScoreB}</span>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs text-slate-400 uppercase tracking-widest">Borta</div>
            <div className="text-xl md:text-2xl font-extrabold text-white">Lag B</div>
          </div>
        </section>

        {/* INNEHÅLL */}
        <main className="max-w-5xl mx-auto">
          {activeTab === "domare" ? (
            /* DOMARVY */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Välj match */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h2 className="text-sm font-bold text-slate-300 uppercase mb-3">Välj Match</h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {matches.map((m, idx) => {
                    const prevMatch = matches[idx - 1];
                    const isNewBlock = prevMatch && prevMatch.block !== m.block;

                    return (
                      <React.Fragment key={m.id}>
                        {isNewBlock && (
                          <div className="my-4 pt-3 border-t-2 border-amber-500/40 text-[11px] uppercase font-bold tracking-widest text-amber-400 text-center bg-slate-900/40 py-1 rounded">
                            Block {m.block}
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedMatchId(m.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${
                            selectedMatchId === m.id
                              ? "bg-amber-500/10 border-amber-500 text-amber-300"
                              : "bg-slate-900/50 border-slate-700/50 hover:bg-slate-700/50"
                          }`}
                        >
                          <div>
                            <span className="font-bold mr-2 text-xs bg-slate-700 px-1.5 py-0.5 rounded text-white">{m.id}</span>
                            <span className="text-xs text-slate-300">{m.player1} vs {m.player2}</span>
                          </div>
                          <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded">
                            {m.score1} - {m.score2}
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Registrera Match & Prestationer */}
              <div className="md:col-span-2 space-y-6">
                {currentMatch && (
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center justify-between">
                      <span>Inmatning Match: {currentMatch.id}</span>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-normal uppercase">
                        {currentMatch.type}
                      </span>
                    </h2>

                    {/* Poängändring */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-lg mb-6">
                      <div className="text-center">
                        <p className="text-sm font-semibold mb-2 text-slate-300">{currentMatch.player1}</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(currentMatch.id, Math.max(0, currentMatch.score1 - 1), currentMatch.score2)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded font-bold text-white"
                          >-</button>
                          <span className="text-2xl font-black w-8 text-center">{currentMatch.score1}</span>
                          <button
                            type="button"
                            onClick={() => handleScoreChange(currentMatch.id, currentMatch.score1 + 1, currentMatch.score2)}
                            className="w-8 h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold"
                          >+</button>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-semibold mb-2 text-slate-300">{currentMatch.player2}</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(currentMatch.id, currentMatch.score1, Math.max(0, currentMatch.score2 - 1))}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded font-bold text-white"
                          >-</button>
                          <span className="text-2xl font-black w-8 text-center">{currentMatch.score2}</span>
                          <button
                            type="button"
                            onClick={() => handleScoreChange(currentMatch.id, currentMatch.score1, currentMatch.score2 + 1)}
                            className="w-8 h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    {/* Formulär Prestationer */}
                    <form onSubmit={handleAddAchievement} className="border-t border-slate-700 pt-4">
                      <h3 className="text-sm font-bold text-slate-300 mb-3">Registrera Prestation i {currentMatch.id}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <select
                          value={newAchPlayer}
                          onChange={(e) => setNewAchPlayer(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400"
                          required
                        >
                          <option value="">-- Välj spelare --</option>
                          {getSelectablePlayers(currentMatch).map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                          ))}
                        </select>

                        <select
                          value={newAchType}
                          onChange={(e) => setNewAchType(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="180">180</option>
                          <option value="Hög Utgång">Hög Utgång (100+)</option>
                          <option value="Kort Leg">Kort Leg (≤ 15 pilar)</option>
                          <option value="Övrigt">Övrigt</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Värde (ex. 120 ut, 14 pilar)"
                          value={newAchValue}
                          onChange={(e) => setNewAchValue(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold py-2 rounded text-sm transition-all"
                      >
                        + Lägg till prestation
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PUBLIKVY (LIVE) */
            <div className="space-y-8">
              {/* Matcher uppdelade per Block */}
              <div className="space-y-6">
                {[1, 2, 3, 4].map((blockNum) => {
                  const blockMatches = matches.filter((m) => m.block === blockNum);
                  let blockTitle = "";
                  if (blockNum === 1) blockTitle = "Block 1: Singlar (S1 - S3)";
                  if (blockNum === 2) blockTitle = "Block 2: Dubblar (D1 - D2)";
                  if (blockNum === 3) blockTitle = "Block 3: Singlar (S4 - S7)";
                  if (blockNum === 4) blockTitle = "Block 4: Singel S8 & Avgörande Dubbel (AD)";

                  return (
                    <div key={blockNum} className="bg-slate-800/80 rounded-xl border border-slate-700 p-5 shadow-lg relative overflow-hidden">
                      {/* Tydlig block-avskiljare */}
                      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
                        <h3 className="text-amber-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400"></span>
                          {blockTitle}
                        </h3>
                        <span className="text-xs bg-slate-900 text-amber-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                          BLOCK {blockNum}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {blockMatches.map((m) => {
                          const isP1Winner = m.winner === 1;
                          const isP1Loser = m.winner === 2;
                          const isP2Winner = m.winner === 2;
                          const isP2Loser = m.winner === 1;

                          return (
                            <div
                              key={m.id}
                              className={`p-4 rounded-lg border transition-all ${
                                m.completed
                                  ? "bg-slate-900 border-slate-700"
                                  : "bg-slate-950/40 border-slate-800"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold bg-slate-700 px-2 py-0.5 rounded text-slate-200">
                                  {m.id}
                                </span>
                                <span className="text-[10px] uppercase text-slate-400 font-semibold">
                                  {m.completed ? "Avslutad" : "Pågår / Kommande"}
                                </span>
                              </div>

                              {/* Spelare 1 vs Spelare 2 */}
                              <div className="flex justify-between items-center my-2 gap-2">
                                <div className="flex-1 pr-1">
                                  {renderPlayerName(m.player1, isP1Winner, isP1Loser)}
                                </div>
                                <div className="text-lg font-black font-mono bg-slate-950 px-3 py-1 rounded border border-slate-800 text-amber-300">
                                  {m.score1} - {m.score2}
                                </div>
                                <div className="flex-1 pl-1 text-right">
                                  {renderPlayerName(m.player2, isP2Winner, isP2Loser)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LIVE PRESTATIONER BOARD */}
              <div className="bg-slate-800/90 rounded-xl border border-amber-500/40 p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <span>🔥 Live Prestationer</span>
                  </h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-semibold animate-pulse">
                    Realtid
                  </span>
                </div>

                {achievements.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">Inga prestationer registrerade ännu.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              {ach.type}
                            </span>
                            <span className="text-xs text-slate-400">Match {ach.matchId}</span>
                          </div>
                          <div className="font-semibold text-sm text-white mt-1">{ach.player}</div>
                          {ach.value && <div className="text-xs text-slate-300">{ach.value}</div>}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono self-start">{ach.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
