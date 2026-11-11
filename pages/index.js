if (typeof window !== 'undefined') {
  window.addEventListener('error', function(e) {
    alert('Krasch: ' + e.message + ' i ' + e.filename + ':' + e.lineno);
  });
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
if (typeof window !== 'undefined') {
  window.onerror = function(msg, url, line) {
    alert("iPad-fel: " + msg + " på rad " + line);
  };
}
const INITIAL_SUB_MATCHES = [
  // Block 1
  { id: 'S1', name: 'Singel 1', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'S2', name: 'Singel 2', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'D1', name: 'Dubbel 1', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'S3', name: 'Singel 3', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  // Block 2
  { id: 'S4', name: 'Singel 4', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'S5', name: 'Singel 5', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'S6', name: 'Singel 6', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'D2', name: 'Dubbel 2', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  // Block 3
  { id: 'S7', name: 'Singel 7', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  { id: 'S8', name: 'Singel 8', type: 'single', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' },
  // Block 4
  { id: 'AD', name: 'Avgörande Dubbel', type: 'double', homePlayer: '', awayPlayer: '', homeScore: 0, awayScore: 0, currentHomePoints: 501, currentAwayPoints: 501, status: 'pending' }
];
const IMPOSSIBLE_CHECKOUTS = [159, 162, 163, 165, 166, 168, 169];

// --- 1. ADMIN VY ---
function AdminView({ matchData, setMatchData, isAdminAuthenticated, setIsAdminAuthenticated }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [newPerfTeam, setNewPerfTeam] = useState('home');
  const [newPerfPlayer, setNewPerfPlayer] = useState('');
  const [manualCheckoutScore, setManualCheckoutScore] = useState('');
  const [newPerfTextType, setNewPerfTextType] = useState('180');
  const [customPerfText, setCustomPerfText] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin') {
      setIsAdminAuthenticated(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Fel lösenord! Försök igen.');
    }
  };

  const handleTeamChange = (e) => {
    var obj = {};
    obj[e.target.name] = e.target.value;
    setMatchData(Object.assign({}, matchData, obj));
  };

  const handleRosterChange = (teamKey, index, value) => {
    const updatedRoster = (matchData[teamKey] || []).slice();
    updatedRoster[index] = value;
    var obj = {};
    obj[teamKey] = updatedRoster;
    setMatchData(Object.assign({}, matchData, obj));
  };

  const addRosterPlayer = (teamKey) => {
    const roster = matchData[teamKey] || [];
    if (roster.length >= 7) {
      alert('Max 7 spelare tillåtna per lag.');
      return;
    }
    var obj = {};
    obj[teamKey] = roster.concat(['']);
    setMatchData(Object.assign({}, matchData, obj));
  };

  const removeRosterPlayer = (teamKey, index) => {
    const roster = matchData[teamKey] || [];
    if (roster.length <= 4) {
      alert('Minst 4 spelare krävs per lag.');
      return;
    }
    const updatedRoster = roster.filter((_, idx) => idx !== index);
    var obj = {};
    obj[teamKey] = updatedRoster;
    setMatchData(Object.assign({}, matchData, obj));
  };

  const handleSubMatchChange = (id, field, value) => {
    const subMatchesList = matchData && matchData.subMatches ? matchData.subMatches : [];
    const updated = subMatchesList.map(sm => {
      if (sm.id === id) {
        var updatedMatch = Object.assign({}, sm);
        updatedMatch[field] = value;
        if (field === 'homeScore' || field === 'awayScore') {
          updatedMatch[field] = parseInt(value, 10) || 0;
        }
        return updatedMatch;
      }
      return sm;
    });
    setMatchData(Object.assign({}, matchData, { subMatches: updated }));
  };

  const handleResetSingleSubMatch = (id) => {
    const subMatchesList = matchData && matchData.subMatches ? matchData.subMatches : [];
    const targetMatch = subMatchesList.find(sm => sm.id === id);
    if (!targetMatch) return;
    if (!window.confirm('Är du säker på att du vill nollställa Match ' + id + '? Det rensar poäng, legs och prestationer för denna match.')) {
      return;
    }
    const homePlayers = (targetMatch.homePlayer || '').split(' / ').filter(Boolean);
    const awayPlayers = (targetMatch.awayPlayer || '').split(' / ').filter(Boolean);
    const matchPlayers = homePlayers.concat(awayPlayers);
    const updatedSubMatches = subMatchesList.map(sm => {
      if (sm.id === id) {
        return Object.assign({}, sm, {
          homeScore: 0,
          awayScore: 0,
          currentHomePoints: 501,
          currentAwayPoints: 501,
          status: 'pending'
        });
      }
      return sm;
    });
    const performancesList = matchData && matchData.performances ? matchData.performances : [];
    const updatedPerformances = performancesList.filter(p => {
      return matchPlayers.indexOf(p.player) === -1;
    });
    setMatchData(Object.assign({}, matchData, {
      subMatches: updatedSubMatches,
      performances: updatedPerformances
    }));
  };

  const handleDoublePlayerChange = (id, side, playerNum, value) => {
    const fieldName = side === 'home' ? 'homePlayer' : 'awayPlayer';
    const subMatchesList = matchData && matchData.subMatches ? matchData.subMatches : [];
    const match = subMatchesList.find(sm => sm.id === id);
    const currentName = match ? (match[fieldName] || '') : '';
    let parts = currentName.split(' / ');
    let p1 = parts[0] || '';
    let p2 = parts[1] || '';
    if (playerNum === 1) p1 = value;
    if (playerNum === 2) p2 = value;
    const combinedName = [p1, p2].filter(Boolean).join(' / ');
    handleSubMatchChange(id, fieldName, combinedName);
  };

  const handleAddManualPerformance = () => {
    if (!newPerfPlayer.trim()) {
      alert('Ange spelarens namn.');
      return;
    }
    let textToSave = '';
    if (newPerfTextType === '180') textToSave = '180';
    else if (newPerfTextType === 'utgang') {
      if (!manualCheckoutScore || isNaN(manualCheckoutScore) || manualCheckoutScore < 100 || manualCheckoutScore > 170 || IMPOSSIBLE_CHECKOUTS.indexOf(parseInt(manualCheckoutScore, 10)) !== -1) {
        alert('Ange en giltig utgångspoäng (100-170).');
        return;
      }
      textToSave = manualCheckoutScore + ' ut';
    }
    else if (newPerfTextType === 'custom') textToSave = customPerfText.trim();
    if (!textToSave) {
      alert('Ange prestationsbeskrivning.');
      return;
    }
    const newPerf = {
      id: Date.now(),
      team: newPerfTeam,
      player: newPerfPlayer.trim(),
      text: textToSave
    };
    const performancesList = matchData && matchData.performances ? matchData.performances : [];
    setMatchData(Object.assign({}, matchData, {
      performances: performancesList.concat([newPerf])
    }));
    setNewPerfPlayer('');
    setCustomPerfText('');
    setManualCheckoutScore('');
  };

  const handleRemovePerformance = (indexToRemove) => {
    const performancesList = matchData && matchData.performances ? matchData.performances : [];
    setMatchData(Object.assign({}, matchData, {
      performances: performancesList.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleResetMatchKeepTeams = () => {
    if (window.confirm('Är du säker på att du vill nollställa alla resultat och delmatcher? Lagnamn och spelartrupper behålls.')) {
      setMatchData(Object.assign({}, matchData, {
        subMatches: INITIAL_SUB_MATCHES,
        performances: []
      }));
    }
  };

  const handleResetEntireMatch = () => {
    if (window.confirm('⚠️ Är du helt säker? Detta nollställer HELA matchen inklusive alla lagnamn, spelartrupper och resultat!')) {
      setMatchData({
        homeTeam: 'Hemmalag',
        awayTeam: 'Bortalag',
        homeRoster: ['Spelare H1', 'Spelare H2', 'Spelare H3', 'Spelare H4'],
        awayRoster: ['Spelare B1', 'Spelare B2', 'Spelare B3', 'Spelare B4'],
        subMatches: INITIAL_SUB_MATCHES,
        performances: []
      });
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '15px' }}>Admin Inloggning</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Ange lösenord"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '16px', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          {errorMessage && <div style={{ color: '#f43f5e', fontSize: '14px', marginBottom: '12px' }}>{errorMessage}</div>}
          <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            Lås upp
          </button>
        </form>
      </div>
    );
  }

  const homeRosterList = matchData && matchData.homeRoster ? matchData.homeRoster : [];
  const awayRosterList = matchData && matchData.awayRoster ? matchData.awayRoster : [];
  const allActivePlayers = homeRosterList.concat(awayRosterList).filter(function(n) { return n && n.trim() !== ''; });
  const subMatchesList = matchData && matchData.subMatches ? matchData.subMatches : [];
  const performancesList = matchData && matchData.performances ? matchData.performances : [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h1 style={{ color: '#60a5fa', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Admin - Redigering av resultat & prestationer</h1>
        <button onClick={() => setIsAdminAuthenticated(false)} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
          🔒 Lås Admin
        </button>
      </div>
      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 'bold' }}>🔄 MATCH-NOLLSTÄLLNING:</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleResetMatchKeepTeams} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Nollställ Alla Matcher (Behåll lag & spelare)
          </button>
          <button onClick={handleResetEntireMatch} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            ⚠️ HELT ny match (Nollställ allt)
          </button>
        </div>
      </div>
      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>LAG OCH SPELARTRUPPER (4-7 Spelare)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: '#60a5fa', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>HEMMALAG</label>
            <input name="homeTeam" value={matchData.homeTeam || ''} onChange={handleTeamChange} style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', marginBottom: '10px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Spelare Hemmalag:</div>
            {homeRosterList.map((player, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  placeholder={'Spelare ' + (idx + 1)}
                  value={player}
                  onChange={(e) => handleRosterChange('homeRoster', idx, e.target.value)}
                  style={{ flex: 1, backgroundColor: '#0f172a', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '13px' }}
                />
                {homeRosterList.length > 4 && (
                  <button onClick={() => removeRosterPlayer('homeRoster', idx)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            {homeRosterList.length < 7 && (
              <button onClick={() => addRosterPlayer('homeRoster')} style={{ width: '100%', backgroundColor: '#334155', color: '#60a5fa', border: '1px dashed #475569', padding: '6px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                + Lägg till spelare
              </button>
            )}
          </div>
          <div>
            <label style={{ display: 'block', color: '#f43f5e', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>BORTALAG</label>
            <input name="awayTeam" value={matchData.awayTeam || ''} onChange={handleTeamChange} style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', marginBottom: '10px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Spelare Bortalag:</div>
            {awayRosterList.map((player, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  placeholder={'Spelare ' + (idx + 1)}
                  value={player}
                  onChange={(e) => handleRosterChange('awayRoster', idx, e.target.value)}
                  style={{ flex: 1, backgroundColor: '#0f172a', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '13px' }}
                />
                {awayRosterList.length > 4 && (
                  <button onClick={() => removeRosterPlayer('awayRoster', idx)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            {awayRosterList.length < 7 && (
              <button onClick={() => addRosterPlayer('awayRoster')} style={{ width: '100%', backgroundColor: '#334155', color: '#f43f5e', border: '1px dashed #475569', padding: '6px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                + Lägg till spelare
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>VÄLJ SPELARE TILL MATCHERNAS UTTAGNING</h2>
        {subMatchesList.map((sm) => {
          const isDouble = sm.type === 'double';
          const partsH = (sm.homePlayer || '').split(' / ');
          const hP1 = partsH[0] || '';
          const hP2 = partsH[1] || '';
          const partsA = (sm.awayPlayer || '').split(' / ');
          const aP1 = partsA[0] || '';
          const aP2 = partsA[1] || '';
          return (
            <div key={sm.id} style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '32px', color: '#eab308', fontWeight: 'bold', textAlign: 'center', fontSize: '14px' }}>{sm.id}</span>
                <div style={{ flex: 1 }}>
                  {!isDouble ? (
                    <select
                      value={sm.homePlayer || ''}
                      onChange={(e) => handleSubMatchChange(sm.id, 'homePlayer', e.target.value)}
                      style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569' }}
                    >
                      <option value="">-- Välj spelare ({matchData.homeTeam || 'Hemmalag'}) --</option>
                      {homeRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select value={hP1} onChange={(e) => handleDoublePlayerChange(sm.id, 'home', 1, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 1 --</option>
                        {homeRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                      <select value={hP2} onChange={(e) => handleDoublePlayerChange(sm.id, 'home', 2, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 2 --</option>
                        {homeRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>VS</span>
                <div style={{ flex: 1 }}>
                  {!isDouble ? (
                    <select
                      value={sm.awayPlayer || ''}
                      onChange={(e) => handleSubMatchChange(sm.id, 'awayPlayer', e.target.value)}
                      style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569' }}
                    >
                      <option value="">-- Välj spelare ({matchData.awayTeam || 'Bortalag'}) --</option>
                      {awayRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select value={aP1} onChange={(e) => handleDoublePlayerChange(sm.id, 'away', 1, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 1 --</option>
                        {awayRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                      <select value={aP2} onChange={(e) => handleDoublePlayerChange(sm.id, 'away', 2, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 2 --</option>
                        {awayRosterList.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleResetSingleSubMatch(sm.id)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Nollställ Match
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
                  <span>Legs:</span>
                  <input type="number" min="0" max="3" value={sm.homeScore || 0} onChange={(e) => handleSubMatchChange(sm.id, 'homeScore', e.target.value)} style={{ width: '45px', backgroundColor: '#0f172a', color: '#fcd34d', border: '1px solid #475569', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', padding: '2px' }} />
                  <span>-</span>
                  <input type="number" min="0" max="3" value={sm.awayScore || 0} onChange={(e) => handleSubMatchChange(sm.id, 'awayScore', e.target.value)} style={{ width: '45px', backgroundColor: '#0f172a', color: '#fcd34d', border: '1px solid #475569', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', padding: '2px' }} />
                  <select value={sm.status || 'pending'} onChange={(e) => handleSubMatchChange(sm.id, 'status', e.target.value)} style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '4px', padding: '3px 6px' }}>
                    <option value="pending">Ej påbörjad</option>
                    <option value="live">Pågår (LIVE)</option>
                    <option value="completed">Klar (Spelad)</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>MANUELLA PRESTATIONER</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr auto', gap: '8px', marginBottom: '15px', alignItems: 'center' }}>
          <select value={newPerfTeam} onChange={(e) => setNewPerfTeam(e.target.value)} style={{ backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569' }}>
            <option value="home">{matchData.homeTeam || 'Hemmalag'}</option>
            <option value="away">{matchData.awayTeam || 'Bortalag'}</option>
          </select>
          {allActivePlayers.length > 0 ? (
            <select value={newPerfPlayer} onChange={(e) => setNewPerfPlayer(e.target.value)} style={{ backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569' }}>
              <option value="">-- Välj spelare --</option>
              {allActivePlayers.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
            </select>
          ) : (
            <input
              placeholder="Spelarnamn"
              value={newPerfPlayer}
              onChange={(e) => setNewPerfPlayer(e.target.value)}
              style={{ backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569' }}
            />
          )}
          <select value={newPerfTextType} onChange={(e) => setNewPerfTextType(e.target.value)} style={{ backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569' }}>
            <option value="180">180</option>
            <option value="utgang">Hög utgång (100+)</option>
            <option value="custom">Annan text...</option>
          </select>
          <button onClick={handleAddManualPerformance} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Lägg till
          </button>
        </div>
        {newPerfTextType === 'utgang' && (
          <div style={{ marginBottom: '15px' }}>
            <input
              type="number"
              placeholder="Ange utgångspoäng (t.ex. 143)"
              value={manualCheckoutScore}
              onChange={(e) => setManualCheckoutScore(e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', boxSizing: 'border-box' }}
            />
          </div>
        )}
        {newPerfTextType === 'custom' && (
          <div style={{ marginBottom: '15px' }}>
            <input
              placeholder="Skriv t.ex: 15 pilars leg"
              value={customPerfText}
              onChange={(e) => setCustomPerfText(e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', boxSizing: 'border-box' }}
            />
          </div>
        )}
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}>BEFINTLIGA PRESTATIONER ({performancesList.length}):</div>
          {performancesList.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Inga prestationer registrerade ännu.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {performancesList.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}>
                  <span>
                    <strong style={{ color: p.team === 'home' ? '#60a5fa' : '#f43f5e' }}>
                      [{p.team === 'home' ? matchData.homeTeam : matchData.awayTeam}]
                    </strong>{' '}
                    {p.player} – <span style={{ color: '#fcd34d' }}>{p.text}</span>
                  </span>
                  <button onClick={() => handleRemovePerformance(idx)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                    Ta bort
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 2. STATISTIK VY ---
function StatsView({ matchData }) {
  const safeMatchData = matchData || {};
  const subMatches = safeMatchData.subMatches || [];
  const performances = safeMatchData.performances || [];

  const homeTeam = safeMatchData.homeTeam || 'Hemmalag';
  const awayTeam = safeMatchData.awayTeam || 'Bortalag';

  var playerStats = {};

  const registerPlayer = (name, team) => {
    if (!name) return;
    var trimmed = name.trim();
    if (!trimmed) return;
    if (!playerStats[trimmed]) {
      playerStats[trimmed] = {
        name: trimmed,
        team: team,
        matchesPlayed: 0,
        matchesWon: 0,
        legsWon: 0,
        legsLost: 0,
        totalScore: 0,
        totalDarts: 0,
        threeDartAvg: 0,
        highCheckouts: [],
        shortestLegs: []
      };
    }
  };

  (safeMatchData.homeRoster || []).forEach(function(p) { registerPlayer(p, homeTeam); });
  (safeMatchData.awayRoster || []).forEach(function(p) { registerPlayer(p, awayTeam); });

  subMatches.forEach(function(sm) {
    if (sm.homePlayer) sm.homePlayer.split(' / ').forEach(function(p) { registerPlayer(p, homeTeam); });
    if (sm.awayPlayer) sm.awayPlayer.split(' / ').forEach(function(p) { registerPlayer(p, awayTeam); });

    const isCompleted = sm.status === 'completed' || sm.homeScore === 3 || sm.awayScore === 3;
    if (isCompleted) {
      const hScore = sm.homeScore || 0;
      const aScore = sm.awayScore || 0;

      if (sm.homePlayer) {
        sm.homePlayer.split(' / ').forEach(function(p) {
          var cleanP = p.trim();
          if (playerStats[cleanP]) {
            playerStats[cleanP].matchesPlayed += 1;
            playerStats[cleanP].legsWon += hScore;
            playerStats[cleanP].legsLost += aScore;
            if (hScore > aScore) playerStats[cleanP].matchesWon += 1;
          }
        });
      }
      if (sm.awayPlayer) {
        sm.awayPlayer.split(' / ').forEach(function(p) {
          var cleanP = p.trim();
          if (playerStats[cleanP]) {
            playerStats[cleanP].matchesPlayed += 1;
            playerStats[cleanP].legsWon += aScore;
            playerStats[cleanP].legsLost += hScore;
            if (aScore > hScore) playerStats[cleanP].matchesWon += 1;
          }
        });
      }
    }

    if (sm.rounds && Array.isArray(sm.rounds)) {
      sm.rounds.forEach(function(round) {
        if (round.home && round.home.rawScore !== undefined && sm.homePlayer && !round.home.isScoring) {
          var hScoreVal = round.home.score === 'BUST' ? 0 : (round.home.rawScore || 0);
          var hDarts = round.home.dartsUsed !== undefined ? round.home.dartsUsed : 3;
          sm.homePlayer.split(' / ').forEach(function(p) {
            var cleanP = p.trim();
            if (playerStats[cleanP]) {
              playerStats[cleanP].totalScore += hScoreVal;
              playerStats[cleanP].totalDarts += hDarts;
            }
          });
        }
        if (round.away && round.away.rawScore !== undefined && sm.awayPlayer && !round.away.isScoring) {
          var aScoreVal = round.away.score === 'BUST' ? 0 : (round.away.rawScore || 0);
          var aDarts = round.away.dartsUsed !== undefined ? round.away.dartsUsed : 3;
          sm.awayPlayer.split(' / ').forEach(function(p) {
            var cleanP = p.trim();
            if (playerStats[cleanP]) {
              playerStats[cleanP].totalScore += aScoreVal;
              playerStats[cleanP].totalDarts += aDarts;
            }
          });
        }
      });
    }
  });

  performances.forEach(function(perf) {
    var pName = (perf.player || '').trim();
    if (!pName) return;
    if (!playerStats[pName]) {
      playerStats[pName] = {
        name: pName,
        team: perf.team === 'home' ? homeTeam : awayTeam,
        matchesPlayed: 0,
        matchesWon: 0,
        legsWon: 0,
        legsLost: 0,
        totalScore: 0,
        totalDarts: 0,
        threeDartAvg: 0,
        highCheckouts: [],
        shortestLegs: []
      };
    }
    var txt = (perf.text || '').toLowerCase();
    if (txt.indexOf('ut') !== -1) {
      var checkoutVal = parseInt(perf.text, 10);
      if (!isNaN(checkoutVal)) {
        playerStats[pName].highCheckouts.push(checkoutVal);
      }
    }
    if (txt.indexOf('pilars leg') !== -1) {
      var legDarts = parseInt(perf.text, 10);
      if (!isNaN(legDarts)) {
        playerStats[pName].shortestLegs.push(legDarts);
      }
    }
  });

  var playersArray = [];
  for (var key in playerStats) {
    if (playerStats.hasOwnProperty(key)) {
      var pl = playerStats[key];
      if (pl.totalDarts > 0) {
        pl.threeDartAvg = parseFloat(((pl.totalScore / pl.totalDarts) * 3).toFixed(2));
      } else {
        pl.threeDartAvg = 0.0;
      }

      if (pl.highCheckouts.length > 0) {
        pl.maxCheckout = Math.max.apply(null, pl.highCheckouts);
      } else {
        pl.maxCheckout = 0;
      }

      if (pl.shortestLegs.length > 0) {
        pl.minDartsLeg = Math.min.apply(null, pl.shortestLegs);
      } else {
        pl.minDartsLeg = 0;
      }

      playersArray.push(pl);
    }
  }

  playersArray.sort(function(a, b) {
    return b.threeDartAvg - a.threeDartAvg;
  });

  return (
    <div style={{ width: '98vw', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff', padding: '10px 0' }}>
      <div style={{ backgroundColor: '#090d16', padding: '16px 24px', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#60a5fa', margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '2px' }}>STATISTIK</h2>
      </div>

      <div style={{ backgroundColor: '#090d16', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        {playersArray.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '18px', textAlign: 'center' }}>Inga spelare registrerade ännu.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '3px solid #334155', color: '#94a3b8', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' }}>
                  <th style={{ padding: '14px 10px', width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '14px 10px' }}>Spelare</th>
                  <th style={{ padding: '14px 10px' }}>Lag</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center', color: '#38bdf8' }}>3-pils Snitt</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center' }}>Matcher</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center' }}>Vinster</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center' }}>Legs (V-F)</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center' }}>Kortast leg</th>
                  <th style={{ padding: '14px 10px', textAlign: 'center' }}>Högsta Utgång</th>
                </tr>
              </thead>
              <tbody>
                {playersArray.map(function(pl, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b', height: '55px' }}>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', color: i === 0 ? '#fcd34d' : '#64748b', fontSize: '18px' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '14px 10px', fontWeight: 'bold', color: '#f8fafc', fontSize: '17px' }}>{pl.name}</td>
                      <td style={{ padding: '14px 10px', color: pl.team === homeTeam ? '#60a5fa' : '#f43f5e', fontWeight: 'bold' }}>{pl.team}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#38bdf8', fontWeight: '900', fontSize: '20px' }}>
                        {pl.threeDartAvg > 0 ? pl.threeDartAvg.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '16px' }}>{pl.matchesPlayed}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#22c55e', fontWeight: 'bold', fontSize: '17px' }}>{pl.matchesWon}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontSize: '16px' }}>{pl.legsWon} - {pl.legsLost}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#f59e0b', fontWeight: 'bold', fontSize: '16px' }}>
                        {pl.minDartsLeg > 0 ? pl.minDartsLeg + ' pilar' : '-'}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: '#a7f3d0', fontWeight: 'bold', fontSize: '16px' }}>
                        {pl.maxCheckout > 0 ? pl.maxCheckout : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
// --- 3. PUBLIKVY (FAST 2-KOLUMNERS RUTNÄT + LIVE PILSNITT) ---
function PublicView({ matchData }) {
  const safeMatchData = matchData || {};
  const subMatches = safeMatchData.subMatches || [];
  const homeTotalMatches = subMatches.filter(m => m.homeScore === 3).length;
  const awayTotalMatches = subMatches.filter(m => m.awayScore === 3).length;
  const homeTotalLegs = subMatches.reduce((sum, m) => sum + (m.homeScore || 0), 0);
  const awayTotalLegs = subMatches.reduce((sum, m) => sum + (m.awayScore || 0), 0);

  const homeTeam = safeMatchData.homeTeam || 'Hemmalag';
  const awayTeam = safeMatchData.awayTeam || 'Bortalag';

  var playerStats = {};
  const regP = function(name, team) {
    if (!name) return;
    var t = name.trim();
    if (t && !playerStats[t]) {
      playerStats[t] = { name: t, team: team, totalScore: 0, totalDarts: 0, threeDartAvg: 0, maxCheckout: 0 };
    }
  };

  (safeMatchData.homeRoster || []).forEach(function(p) { regP(p, homeTeam); });
  (safeMatchData.awayRoster || []).forEach(function(p) { regP(p, awayTeam); });

  subMatches.forEach(function(sm) {
    if (sm.homePlayer) sm.homePlayer.split(' / ').forEach(function(p) { regP(p, homeTeam); });
    if (sm.awayPlayer) sm.awayPlayer.split(' / ').forEach(function(p) { regP(p, awayTeam); });

    if (sm.rounds && Array.isArray(sm.rounds)) {
      sm.rounds.forEach(function(round) {
        if (round.home && round.home.rawScore !== undefined && sm.homePlayer && !round.home.isScoring) {
          var sc = round.home.score === 'BUST' ? 0 : (round.home.rawScore || 0);
          var dt = round.home.dartsUsed !== undefined ? round.home.dartsUsed : 3;
          sm.homePlayer.split(' / ').forEach(function(p) {
            var tp = p.trim();
            if (playerStats[tp]) { playerStats[tp].totalScore += sc; playerStats[tp].totalDarts += dt; }
          });
        }
        if (round.away && round.away.rawScore !== undefined && sm.awayPlayer && !round.away.isScoring) {
          var scA = round.away.score === 'BUST' ? 0 : (round.away.rawScore || 0);
          var dtA = round.away.dartsUsed !== undefined ? round.away.dartsUsed : 3;
          sm.awayPlayer.split(' / ').forEach(function(p) {
            var tp = p.trim();
            if (playerStats[tp]) { playerStats[tp].totalScore += scA; playerStats[tp].totalDarts += dtA; }
          });
        }
      });
    }
  });

  (safeMatchData.performances || []).forEach(function(perf) {
    var pName = (perf.player || '').trim();
    if (pName && playerStats[pName]) {
      var coVal = parseInt(perf.text, 10);
      if (!isNaN(coVal) && coVal > playerStats[pName].maxCheckout) {
        playerStats[pName].maxCheckout = coVal;
      }
    }
  });

  var livePlayersArr = [];
  for (var k in playerStats) {
    if (playerStats.hasOwnProperty(k)) {
      var lp = playerStats[k];
      lp.threeDartAvg = lp.totalDarts > 0 ? parseFloat(((lp.totalScore / lp.totalDarts) * 3).toFixed(2)) : 0;
      livePlayersArr.push(lp);
    }
  }
  livePlayersArr.sort(function(a, b) { return b.threeDartAvg - a.threeDartAvg; });

  const HOME_STARTS = ['S1', 'D1', 'S4', 'S6', 'S7'];
  const getMatchStarter = (sm) => {
    if (sm.legStarter) return sm.legStarter;
    if (sm.id === 'AD') return null;
    return HOME_STARTS.includes(sm.id) ? 'home' : 'away';
  };

  const renderPlayerName = (name, isWinner, isLoser, isHome, startsMatch) => {
    const displayName = name || (isHome ? safeMatchData.homeTeam : safeMatchData.awayTeam) || 'Spelare';
    const ArrowIndicator = startsMatch ? (
      <span style={{ fontSize: '11px', color: '#38bdf8', backgroundColor: '#0f172a', border: '1px solid #0284c7', padding: '1px 5px', borderRadius: '4px', fontWeight: '900', display: 'inline-block' }}>
        {isHome ? '▶' : '◀'}
      </span>
    ) : null;
    if (isWinner) {
      return (
        <span style={{ fontSize: '15px', fontWeight: '900', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          {isHome && ArrowIndicator} {isHome && <span>🏆</span>} <span>{displayName}</span> {!isHome && <span>🏆</span>} {!isHome && ArrowIndicator}
        </span>
      );
    }
    if (isLoser) {
      return (
        <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          {isHome && ArrowIndicator} <span>{displayName}</span> {!isHome && ArrowIndicator}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        {isHome && ArrowIndicator} <span>{displayName}</span> {!isHome && ArrowIndicator}
      </span>
    );
  };

  return (
    <div style={{ width: '98vw', margin: '0 auto', fontFamily: 'sans-serif', color: '#fff', padding: '5px 0' }}>
      
      {/* SCOREBOARD BANNER */}
      <div style={{
        backgroundColor: '#090d16',
        borderRadius: '20px',
        border: '2px solid #1e293b',
        padding: '16px 30px',
        marginBottom: '16px',
        boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>HEMMALAG</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px' }}>{homeTeam}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Vunna Legs: <strong style={{ color: '#38bdf8', fontSize: '17px' }}>{homeTotalLegs}</strong></div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#020617', padding: '8px 30px', borderRadius: '16px', border: '2px solid #334155', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)' }}>
              <span style={{ fontSize: '50px', fontWeight: '900', color: '#fcd34d', lineHeight: 1 }}>{homeTotalMatches}</span>
              <span style={{ fontSize: '28px', color: '#475569', margin: '0 16px' }}>—</span>
              <span style={{ fontSize: '50px', fontWeight: '900', color: '#fcd34d', lineHeight: 1 }}>{awayTotalMatches}</span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '2px' }}>MATCHSTÄLLNING</div>
          </div>

          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fb7185', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>BORTALAG</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '1px' }}>{awayTeam}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>Vunna Legs: <strong style={{ color: '#fb7185', fontSize: '17px' }}>{awayTotalLegs}</strong></div>
          </div>
        </div>
      </div>

      {/* HUVUDGRID: EXAKT 2 KOLUMNER FÖR MATCHER + LIVE PILSNITT TILL HÖGER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', alignItems: 'start' }}>
        
        {/* VÄNSTER: 2 FASTKOLUMNERS RUTNÄT FÖR MATCHRNA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {subMatches.map((sm) => {
            const isLive = sm.status === 'live';
            const isCompleted = sm.status === 'completed' || sm.homeScore === 3 || sm.awayScore === 3;
            const isHomeWinner = sm.homeScore === 3;
            const isAwayWinner = sm.awayScore === 3;
            const isHomeLoser = isCompleted && sm.awayScore === 3;
            const isAwayLoser = isCompleted && sm.homeScore === 3;
            const starter = getMatchStarter(sm);
            const homeStarts = starter === 'home';
            const awayStarts = starter === 'away';
            const isHomeTurn = isLive && (sm.turn === 'home' || (!sm.turn && homeStarts));
            const isAwayTurn = isLive && (sm.turn === 'away' || (!sm.turn && awayStarts));

            return (
              <div key={sm.id} style={{
                backgroundColor: isLive ? '#0a1733' : isCompleted ? '#081220' : '#0f172a',
                borderRadius: '16px',
                padding: '12px 14px',
                border: isLive ? '2px solid #22c55e' : isCompleted ? '1px solid #059669' : '1px solid #1e293b',
                boxShadow: isLive ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 4px 6px rgba(0,0,0,0.3)',
                opacity: isCompleted ? 0.85 : 1,
                boxSizing: 'border-box'
              }}>
                {isLive && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
                      <span style={{ color: '#22c55e', fontWeight: '900', fontSize: '11px', letterSpacing: '0.5px' }}>
                        PÅGÅR — MATCH {sm.id}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', backgroundColor: '#22c55e', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>LIVE</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: isCompleted ? '#10b981' : '#eab308', backgroundColor: '#020617', padding: '3px 6px', borderRadius: '6px', textAlign: 'center' }}>
                      {sm.id}
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {renderPlayerName(sm.homePlayer, isHomeWinner, isHomeLoser, true, homeStarts)}
                    </div>
                  </div>

                  {isLive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 2px' }}>
                      <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold', padding: '4px 7px', borderRadius: '6px', border: '1px solid #475569' }}>
                        {sm.homeScore || 0}
                      </div>
                      <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '20px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', border: isHomeTurn ? '2.5px solid #ffee00' : '1px solid #334155', minWidth: '55px', textAlign: 'center' }}>
                        {sm.currentHomePoints ?? 501}
                      </div>
                      <span style={{ color: '#475569', fontSize: '10px', fontWeight: 'bold' }}>VS</span>
                      <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '20px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', border: isAwayTurn ? '2.5px solid #ffee00' : '1px solid #334155', minWidth: '55px', textAlign: 'center' }}>
                        {sm.currentAwayPoints ?? 501}
                      </div>
                      <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold', padding: '4px 7px', borderRadius: '6px', border: '1px solid #475569' }}>
                        {sm.awayScore || 0}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ backgroundColor: isCompleted ? '#022c22' : '#020617', padding: '4px 10px', borderRadius: '6px', border: isCompleted ? '1px solid #059669' : '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: isCompleted ? '#34d399' : '#64748b' }}>{sm.homeScore || 0}</span>
                        <span style={{ color: '#475569', fontSize: '10px' }}>-</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: isCompleted ? '#34d399' : '#64748b' }}>{sm.awayScore || 0}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderPlayerName(sm.awayPlayer, isAwayWinner, isAwayLoser, false, awayStarts)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* HÖGER: LIVE PILSNITT (ALLA SPELARE) */}
        <div style={{
          backgroundColor: '#090d16',
          borderRadius: '20px',
          border: '2px solid #1e293b',
          padding: '18px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          position: 'sticky',
          top: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '12px' }}>
            <h3 style={{ color: '#fcd34d', margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎯</span> LIVE PILSNITT
            </h3>
            <span style={{ fontSize: '10px', backgroundColor: '#22c55e', color: '#000', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>AUTO</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
            {livePlayersArr.map((pl, idx) => {
              const isTop1 = idx === 0 && pl.threeDartAvg > 0;
              const isTop2 = idx === 1 && pl.threeDartAvg > 0;
              const isTop3 = idx === 2 && pl.threeDartAvg > 0;

              return (
                <div key={idx} style={{
                  backgroundColor: isTop1 ? '#1e293b' : '#0f172a',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: isTop1 ? '1px solid #fcd34d' : isTop2 ? '1px solid #94a3b8' : isTop3 ? '1px solid #b45309' : '1px solid #1e293b',
                  boxShadow: isTop1 ? '0 0 10px rgba(252, 211, 77, 0.15)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{
                      fontWeight: '900',
                      fontSize: '13px',
                      color: isTop1 ? '#fcd34d' : isTop2 ? '#cbd5e1' : isTop3 ? '#f97316' : '#475569',
                      minWidth: '20px'
                    }}>
                      #{idx + 1}
                    </span>
                    <strong style={{ color: pl.team === homeTeam ? '#60a5fa' : '#f43f5e', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pl.name}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {pl.maxCheckout > 0 && (
                      <span style={{ color: '#a7f3d0', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#064e3b', padding: '1px 5px', borderRadius: '4px' }} title="Högsta utgång">
                        ut {pl.maxCheckout}
                      </span>
                    )}
                    <span style={{ color: '#38bdf8', fontWeight: '900', fontSize: '16px' }}>
                      {pl.threeDartAvg > 0 ? pl.threeDartAvg.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {livePlayersArr.length === 0 && (
              <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                Inga kast registrerade än
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- 4. HUVUDKOMPONENT (App) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [matchData, setMatchData] = useState({
    homeTeam: 'Hemmalag',
    awayTeam: 'Bortalag',
    homeRoster: ['Spelare H1', 'Spelare H2', 'Spelare H3', 'Spelare H4'],
    awayRoster: ['Spelare B1', 'Spelare B2', 'Spelare B3', 'Spelare B4'],
    subMatches: INITIAL_SUB_MATCHES,
    performances: []
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await supabase
          .from('matches')
          .select('data')
          .eq('id', 'main_match')
          .single();
        if (res && res.data && res.data.data) {
          setMatchData(res.data.data);
        }
      } catch (e) {
        console.log('Kunde inte ladda initial data', e);
      }
    }
    loadInitialData();
    try {
      const channel = supabase
        .channel('realtime_matches')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.main_match' },
          (payload) => {
            if (payload && payload.new && payload.new.data) {
              setMatchData(payload.new.data);
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    } catch(err) {
      console.log('Realtime error', err);
    }
  }, []);

  const saveToSupabase = async (newData) => {
    setMatchData(newData);
    try {
      await supabase.from('matches').upsert({
        id: 'main_match',
        data: newData,
        updated_at: new Date()
      });
    } catch (err) {
      console.log('Kunde inte spara', err);
    }
  };

  const handleAdminSetMatchData = (newData) => {
    saveToSupabase(newData);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', padding: '10px', boxSizing: 'border-box' }}>
      <div style={{ width: '98vw', margin: '0 auto 15px auto', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('public')}
          style={{
            backgroundColor: activeTab === 'public' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          📺 Publikvy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          style={{
            backgroundColor: activeTab === 'stats' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          📊 Statistik
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          style={{
            backgroundColor: activeTab === 'admin' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          ⚙️ Admin
        </button>
      </div>

      {activeTab === 'public' && (
        <PublicView matchData={matchData} />
      )}
      {activeTab === 'stats' && (
        <StatsView matchData={matchData} />
      )}
      {activeTab === 'admin' && (
        <AdminView
          matchData={matchData}
          setMatchData={handleAdminSetMatchData}
          isAdminAuthenticated={isAdminAuthenticated}
          setIsAdminAuthenticated={setIsAdminAuthenticated}
        />
      )}
    </div>
  );
}

// Next.js statisk bygg-fallback
export async function getStaticProps() {
  return {
    props: {
      matchData: {
        subMatches: INITIAL_SUB_MATCHES
      }
    },
    revalidate: 1
  };
}
