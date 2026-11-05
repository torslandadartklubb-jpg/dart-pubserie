import React, { useState, useEffect } from 'react';

// --- HJÄLPFUNKTIONER FÖR STATISTIK ---
function calculatePlayerStats(matchData) {
  const statsMap = {};

  const getPlayerObj = (name, team) => {
    if (!name) return null;
    const key = `${name} (${team})`;
    if (!statsMap[key]) {
      statsMap[key] = {
        name,
        team,
        totalPoints: 0,
        totalDartsThrown: 0,
        shortestLeg: null,
        checkoutsCount: 0,
        checkoutDartsThrown: 0
      };
    }
    return statsMap[key];
  };

  const subMatches = matchData.subMatches || [];
  
  subMatches.forEach(sm => {
    const homeTeam = matchData.homeTeam || 'Hemmalag';
    const awayTeam = matchData.awayTeam || 'Bortalag';

    // Registrera alla spelare i truppen
    if (sm.homePlayer) getPlayerObj(sm.homePlayer, homeTeam);
    if (sm.awayPlayer) getPlayerObj(sm.awayPlayer, awayTeam);

    // Bearbeta historik för statistik
    const history = sm.history || [];
    history.forEach(log => {
      if (!log.player) return;
      const team = log.team === 'home' ? homeTeam : awayTeam;
      const player = getPlayerObj(log.player, team);
      if (!player) return;

      // Beräkna poäng & kastade pilar för snitt
      if (log.pointsScored !== undefined && log.dartsCount) {
        player.totalPoints += log.pointsScored;
        player.totalDartsThrown += log.dartsCount;
      }

      // Beräkna utgångar och kortaste leg
      if (log.isCheckout) {
        player.checkoutsCount += 1;
        player.checkoutDartsThrown += (log.checkoutDarts || log.dartsCount || 3);
        
        if (log.totalLegDarts) {
          if (player.shortestLeg === null || log.totalLegDarts < player.shortestLeg) {
            player.shortestLeg = log.totalLegDarts;
          }
        }
      }
    });
  });

  const players = Object.values(statsMap);

  // Topplista 1: Pilsnitt (per 3 pilar)
  const byAverage = [...players]
    .map(p => ({
      ...p,
      avg: p.totalDartsThrown > 0 ? ((p.totalPoints / p.totalDartsThrown) * 3).toFixed(1) : 0
    }))
    .filter(p => p.totalDartsThrown > 0)
    .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));

  // Topplista 2: Kortast leg (lägst antal pilar)
  const byShortestLeg = [...players]
    .filter(p => p.shortestLeg !== null)
    .sort((a, b) => a.shortestLeg - b.shortestLeg);

  // Topplista 3: Utgångsprocent (%)
  const byCheckoutPct = [...players]
    .map(p => ({
      ...p,
      pct: p.checkoutDartsThrown > 0 ? ((p.checkoutsCount / p.checkoutDartsThrown) * 100).toFixed(1) : 0
    }))
    .filter(p => p.checkoutDartsThrown > 0)
    .sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));

  return { byAverage, byShortestLeg, byCheckoutPct };
}

// --- STATISTIK VY ---
function StatsView({ matchData }) {
  const { byAverage, byShortestLeg, byCheckoutPct } = calculatePlayerStats(matchData);

  const cardStyle = {
    backgroundColor: '#090d16',
    borderRadius: '16px',
    border: '1px solid #1e293b',
    padding: '20px',
    flex: '1 1 300px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
  };

  const headerStyle = {
    color: '#fcd34d',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const itemStyle = (idx) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: idx % 2 === 0 ? '#0f172a' : '#1e293b',
    borderRadius: '8px',
    marginBottom: '8px'
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff', padding: '10px' }}>
      <h2 style={{ textAlign: 'center', color: '#38bdf8', marginBottom: '25px', letterSpacing: '1px' }}>
        📊 SPELARSTATISTIK & TOPPLISTOR
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* TOPPLISTA: PILSNITT */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <span>🎯</span> TOPP PILSNITT (3-DART AVG)
          </div>
          {byAverage.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Ingen data registrerad än.</div>
          ) : (
            byAverage.map((p, idx) => (
              <div key={idx} style={itemStyle(idx)}>
                <div>
                  <strong style={{ color: idx === 0 ? '#fcd34d' : '#f8fafc' }}>{idx + 1}. {p.name}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>({p.team})</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#38bdf8' }}>{p.avg}</span>
              </div>
            ))
          )}
        </div>

        {/* TOPPLISTA: KORTAST LEG */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <span>⚡</span> KORTAST LEG (LÄGST PILAR)
          </div>
          {byShortestLeg.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Inga genomförda utgångar än.</div>
          ) : (
            byShortestLeg.map((p, idx) => (
              <div key={idx} style={itemStyle(idx)}>
                <div>
                  <strong style={{ color: idx === 0 ? '#fcd34d' : '#f8fafc' }}>{idx + 1}. {p.name}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>({p.team})</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>{p.shortestLeg} pilar</span>
              </div>
            ))
          )}
        </div>

        {/* TOPPLISTA: UTGÅNGSPROCENT */}
        <div style={cardStyle}>
          <div style={headerStyle}>
            <span>🏆</span> UTGÅNGSPROCENT (CHECKOUT %)
          </div>
          {byCheckoutPct.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Inga utgångsförsök registrerade än.</div>
          ) : (
            byCheckoutPct.map((p, idx) => (
              <div key={idx} style={itemStyle(idx)}>
                <div>
                  <strong style={{ color: idx === 0 ? '#fcd34d' : '#f8fafc' }}>{idx + 1}. {p.name}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>({p.team})</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#fb7185' }}>{p.pct}%</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// --- PUBLIK VY ---
function PublicView({ matchData }) {
  const subMatches = matchData.subMatches || [];
  const homeTotalMatches = subMatches.filter(m => m.homeScore === 3).length;
  const awayTotalMatches = subMatches.filter(m => m.awayScore === 3).length;
  const homeTotalLegs = subMatches.reduce((sum, m) => sum + (m.homeScore || 0), 0);
  const awayTotalLegs = subMatches.reduce((sum, m) => sum + (m.awayScore || 0), 0);

  const HOME_STARTS = ['S1', 'D1', 'S4', 'S6', 'S7'];

  const getMatchStarter = (sm) => {
    if (sm.legStarter) return sm.legStarter;
    if (sm.id === 'AD') return null;
    return HOME_STARTS.includes(sm.id) ? 'home' : 'away';
  };

  const renderPlayerName = (name, isWinner, isLoser, isHome, startsMatch) => {
    const displayName = name || (isHome ? matchData.homeTeam : matchData.awayTeam) || 'Spelare';
    
    const ArrowIndicator = startsMatch ? (
      <span 
        title="Börjar kasta i matchen"
        style={{ 
          fontSize: '11px', 
          color: '#38bdf8', 
          backgroundColor: '#0f172a',
          border: '1px solid #0284c7',
          padding: '1px 5px', 
          borderRadius: '4px',
          fontWeight: '900',
          display: 'inline-block',
          boxShadow: '0 0 6px rgba(56, 189, 248, 0.4)'
        }}
      >
        {isHome ? '▶' : '◀'}
      </span>
    ) : null;

    if (isWinner) {
      return (
        <span style={{ fontSize: '17px', fontWeight: '900', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {isHome && ArrowIndicator}
          {isHome && <span>🏆</span>}
          <span>{displayName}</span>
          {!isHome && <span>🏆</span>}
          {!isHome && ArrowIndicator}
        </span>
      );
    }
    if (isLoser) {
      return (
        <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#64748b', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {isHome && ArrowIndicator}
          <span>{displayName}</span>
          {!isHome && ArrowIndicator}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        {isHome && ArrowIndicator}
        <span>{displayName}</span>
        {!isHome && ArrowIndicator}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff', padding: '10px' }}>
      
      {/* SCOREBOARD BANNER */}
      <div style={{
        backgroundColor: '#090d16',
        borderRadius: '20px',
        border: '2px solid #1e293b',
        padding: '24px 30px',
        marginBottom: '25px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>HEMMALAG</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa', textShadow: '0 0 12px rgba(96, 165, 250, 0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {matchData.homeTeam || 'Hemmalag'}
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
              Legs: <strong style={{ color: '#38bdf8', fontSize: '16px' }}>{homeTotalLegs}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#020617',
              padding: '10px 28px',
              borderRadius: '16px',
              border: '2px solid #334155',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.8)'
            }}>
              <span style={{ fontSize: '52px', fontWeight: '900', color: '#fcd34d', textShadow: '0 0 15px rgba(252, 211, 77, 0.5)', lineHeight: 1 }}>{homeTotalMatches}</span>
              <span style={{ fontSize: '32px', color: '#475569', margin: '0 16px', fontWeight: '300' }}>—</span>
              <span style={{ fontSize: '52px', fontWeight: '900', color: '#fcd34d', textShadow: '0 0 15px rgba(252, 211, 77, 0.5)', lineHeight: 1 }}>{awayTotalMatches}</span>
            </div>
            <div style={{
              marginTop: '10px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '1.5px'
            }}>
              MATCHSTÄLLNING
            </div>
          </div>

          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fb7185', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>BORTALAG</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#f43f5e', textShadow: '0 0 12px rgba(244, 63, 94, 0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {matchData.awayTeam || 'Bortalag'}
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
              Legs: <strong style={{ color: '#fb7185', fontSize: '16px' }}>{awayTotalLegs}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* DELMATCHEN I TV-GRID (2 KOLUMNER) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(620px, 1fr))',
        gap: '16px',
        marginBottom: '25px'
      }}>
        {subMatches.map((sm) => {
          const isLive = sm.status === 'live';
          const isCompleted = sm.status === 'completed' || sm.homeScore === 3 || sm.awayScore === 3;
          
          const isHomeWinner = sm.homeScore === 3;
          const isAwayWinner = sm.awayScore === 3;
          const isHomeLoser = isCompleted && sm.awayScore === 3;
          const isAwayLoser = isCompleted && sm.homeScore === 3;
          const isBlockGap = sm.id === 'S3' || sm.id === 'D2' || sm.id === 'S8';
          const starter = getMatchStarter(sm);
          const homeStarts = starter === 'home';
          const awayStarts = starter === 'away';

          const isHomeTurn = isLive && (sm.turn === 'home' || (!sm.turn && homeStarts));
          const isAwayTurn = isLive && (sm.turn === 'away' || (!sm.turn && awayStarts));

          return (
            <React.Fragment key={sm.id}>
              <div
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: isLive ? '#0a1329' : isCompleted ? '#09101d' : '#1e293b',
                  borderRadius: '16px',
                  padding: isLive ? '18px 20px' : '14px 18px',
                  border: isLive ? '2px solid #22c55e' : isCompleted ? '2px solid #059669' : '1px solid #1e293b',
                  boxShadow: isLive ? '0 0 20px rgba(34, 197, 94, 0.25)' : 'none',
                  opacity: isCompleted ? 0.88 : 1,
                  color: 'inherit',
                  position: 'relative',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}
              >
                {isLive && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #22c55e'
                      }}></span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>
                        PÅGÅR JUST NU — MATCH {sm.id} ({sm.type === 'single' ? 'Singel' : 'Dubbel'})
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', backgroundColor: '#22c55e', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: '900' }}>
                      LIVE TV
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isCompleted ? '#10b981' : '#eab308',
                      backgroundColor: '#020617',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isCompleted ? '1px solid #047857' : '1px solid #334155',
                      minWidth: '28px',
                      textAlign: 'center'
                    }}>
                      {sm.id}
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {renderPlayerName(sm.homePlayer, isHomeWinner, isHomeLoser, true, homeStarts)}
                    </div>
                  </div>

                  {isLive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 8px' }}>
                      <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '18px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569' }}>
                        {sm.homeScore}
                      </div>
                      <div style={{ 
                        backgroundColor: '#020617', 
                        color: '#ffee00', 
                        fontSize: '28px', 
                        fontWeight: '900', 
                        padding: '6px 14px', 
                        borderRadius: '8px', 
                        border: isHomeTurn ? '3.5px solid #ffee00' : '1px solid #334155', 
                        minWidth: '75px', 
                        textAlign: 'center'
                      }}>
                        {sm.currentHomePoints}
                      </div>

                      <span style={{ color: '#475569', fontWeight: 'bold', fontSize: '12px' }}>VS</span>

                      <div style={{ 
                        backgroundColor: '#020617', 
                        color: '#ffee00', 
                        fontSize: '28px', 
                        fontWeight: '900', 
                        padding: '6px 14px', 
                        borderRadius: '8px', 
                        border: isAwayTurn ? '3.5px solid #ffee00' : '1px solid #334155', 
                        minWidth: '75px', 
                        textAlign: 'center'
                      }}>
                        {sm.currentAwayPoints}
                      </div>

                      <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '18px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569' }}>
                        {sm.awayScore}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        backgroundColor: isCompleted ? '#022c22' : '#020617', 
                        padding: '6px 16px', 
                        borderRadius: '8px', 
                        border: isCompleted ? '1px solid #059669' : '1px solid #334155', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px' 
                      }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#34d399' : '#64748b' }}>{sm.homeScore}</span>
                        <span style={{ color: '#475569', fontSize: '12px' }}>-</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#34d399' : '#64748b' }}>{sm.awayScore}</span>
                      </div>
                      {isCompleted && (
                        <span style={{ fontSize: '10px', backgroundColor: '#065f46', color: '#a7f3d0', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #059669' }}>
                          KLAR
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderPlayerName(sm.awayPlayer, isAwayWinner, isAwayLoser, false, awayStarts)}
                  </div>
                </div>
              </div>

              {isBlockGap && (
                <div style={{ gridColumn: '1 / -1', height: '20px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* PRESTATIONER */}
      <div style={{
        backgroundColor: '#090d16',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #1e293b',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <h3 style={{ color: '#fcd34d', margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⭐</span> MATCHENS HIGHLIGHTS & PRESTATIONER (180s / HÖGA UTGÅNGAR)
          </h3>
          <span style={{ fontSize: '11px', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid #22c55e', fontWeight: 'bold' }}>
            ● AUTO-UPPDATERAS
          </span>
        </div>
        {(matchData.performances || []).length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
            Inga registrerade höga utgångar eller 180s i matchen ännu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(matchData.performances || []).map((p, idx) => (
              <div key={idx} style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <strong style={{ color: p.team === 'home' ? '#60a5fa' : '#f43f5e' }}>
                  {p.player}
                </strong>
                <span style={{ color: '#64748b' }}>|</span>
                <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- HUVUDKOMPONENT MED TAB-NAVIGERUNG ---
export default function MainApp({ matchData, updateMatchData }) {
  const [activeTab, setActiveTab] = useState('public');

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', padding: '15px' }}>
      
      {/* MENYKNAPPAR */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('public')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'public' ? '#38bdf8' : '#1e293b',
            color: activeTab === 'public' ? '#000' : '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📺 Publikvy
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'stats' ? '#38bdf8' : '#1e293b',
            color: activeTab === 'stats' ? '#000' : '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📊 Statistik
        </button>
      </div>

      {/* VY-CONTAINER */}
      {activeTab === 'public' && <PublicView matchData={matchData} />}
      {activeTab === 'stats' && <StatsView matchData={matchData} />}
    </div>
  );
}
