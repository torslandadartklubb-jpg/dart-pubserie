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
    const updatedRoster = matchData[teamKey].slice();
    updatedRoster[index] = value;
    var obj = {};
    obj[teamKey] = updatedRoster;
    setMatchData(Object.assign({}, matchData, obj));
  };

  const addRosterPlayer = (teamKey) => {
    if (matchData[teamKey].length >= 7) {
      alert('Max 7 spelare tillåtna per lag.');
      return;
    }
    var obj = {};
    obj[teamKey] = matchData[teamKey].concat(['']);
    setMatchData(Object.assign({}, matchData, obj));
  };

  const removeRosterPlayer = (teamKey, index) => {
    if (matchData[teamKey].length <= 4) {
      alert('Minst 4 spelare krävs per lag.');
      return;
    }
    const updatedRoster = matchData[teamKey].filter((_, idx) => idx !== index);
    var obj = {};
    obj[teamKey] = updatedRoster;
    setMatchData(Object.assign({}, matchData, obj));
  };

  const handleSubMatchChange = (id, field, value) => {
    const updated = matchData.subMatches.map(sm => {
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
    const targetMatch = (matchData.subMatches || []).find(sm => sm.id === id);
    if (!targetMatch) return;
    if (!window.confirm(`Är du säker på att du vill nollställa Match ${id}? Det rensar poäng, legs och prestationer för denna match.`)) {
      return;
    }
    const homePlayers = (targetMatch.homePlayer || '').split(' / ').filter(Boolean);
    const awayPlayers = (targetMatch.awayPlayer || '').split(' / ').filter(Boolean);
    const matchPlayers = [...homePlayers, ...awayPlayers];
    const updatedSubMatches = (matchData.subMatches || []).map(sm => {
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
    const updatedPerformances = (matchData.performances || []).filter(p => {
      return matchPlayers.indexOf(p.player) === -1;
    });
    setMatchData(Object.assign({}, matchData, {
      subMatches: updatedSubMatches,
      performances: updatedPerformances
    }));
  };

  const handleDoublePlayerChange = (id, side, playerNum, value) => {
    const fieldName = side === 'home' ? 'homePlayer' : 'awayPlayer';
    const match = matchData.subMatches.find(sm => sm.id === id);
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
    setMatchData(Object.assign({}, matchData, {
      performances: matchData.performances.concat([newPerf])
    }));
    setNewPerfPlayer('');
    setCustomPerfText('');
    setManualCheckoutScore('');
  };

  const handleRemovePerformance = (indexToRemove) => {
    setMatchData(Object.assign({}, matchData, {
      performances: matchData.performances.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleResetMatchKeepTeams = () => {
    if (window.confirm('Är du säker på att du vill nollställ alla resultat och delmatcher? Lagnamn och spelartrupper behålls.')) {
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

  const allActivePlayers = (matchData.homeRoster || []).concat(matchData.awayRoster || []).filter(function(n) { return n && n.trim() !== ''; });

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' }}>
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
            <input name="homeTeam" value={matchData.homeTeam} onChange={handleTeamChange} style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', marginBottom: '10px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Spelare Hemmalag:</div>
            {(matchData.homeRoster || []).map((player, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  placeholder={`Spelare ${idx + 1}`}
                  value={player}
                  onChange={(e) => handleRosterChange('homeRoster', idx, e.target.value)}
                  style={{ flex: 1, backgroundColor: '#0f172a', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '13px' }}
                />
                {matchData.homeRoster.length > 4 && (
                  <button onClick={() => removeRosterPlayer('homeRoster', idx)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            {matchData.homeRoster.length < 7 && (
              <button onClick={() => addRosterPlayer('homeRoster')} style={{ width: '100%', backgroundColor: '#334155', color: '#60a5fa', border: '1px dashed #475569', padding: '6px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                + Lägg till spelare
              </button>
            )}
          </div>
          <div>
            <label style={{ display: 'block', color: '#f43f5e', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>BORTALAG</label>
            <input name="awayTeam" value={matchData.awayTeam} onChange={handleTeamChange} style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #475569', marginBottom: '10px', boxSizing: 'border-box', fontWeight: 'bold' }} />
            
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Spelare Bortalag:</div>
            {(matchData.awayRoster || []).map((player, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  placeholder={`Spelare ${idx + 1}`}
                  value={player}
                  onChange={(e) => handleRosterChange('awayRoster', idx, e.target.value)}
                  style={{ flex: 1, backgroundColor: '#0f172a', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '13px' }}
                />
                {matchData.awayRoster.length > 4 && (
                  <button onClick={() => removeRosterPlayer('awayRoster', idx)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 8px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            {matchData.awayRoster.length < 7 && (
              <button onClick={() => addRosterPlayer('awayRoster')} style={{ width: '100%', backgroundColor: '#334155', color: '#f43f5e', border: '1px dashed #475569', padding: '6px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                + Lägg till spelare
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>VÄLJ SPELARE TILL MATCHERNAS UTTAGNING</h2>
        {(matchData.subMatches || []).map((sm) => {
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
                      value={sm.homePlayer}
                      onChange={(e) => handleSubMatchChange(sm.id, 'homePlayer', e.target.value)}
                      style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569' }}
                    >
                      <option value="">-- Välj spelare ({matchData.homeTeam}) --</option>
                      {matchData.homeRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select value={hP1} onChange={(e) => handleDoublePlayerChange(sm.id, 'home', 1, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 1 --</option>
                        {matchData.homeRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                      <select value={hP2} onChange={(e) => handleDoublePlayerChange(sm.id, 'home', 2, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 2 --</option>
                        {matchData.homeRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>VS</span>
                <div style={{ flex: 1 }}>
                  {!isDouble ? (
                    <select
                      value={sm.awayPlayer}
                      onChange={(e) => handleSubMatchChange(sm.id, 'awayPlayer', e.target.value)}
                      style={{ width: '100%', backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569' }}
                    >
                      <option value="">-- Välj spelare ({matchData.awayTeam}) --</option>
                      {matchData.awayRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select value={aP1} onChange={(e) => handleDoublePlayerChange(sm.id, 'away', 1, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 1 --</option>
                        {matchData.awayRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
                      </select>
                      <select value={aP2} onChange={(e) => handleDoublePlayerChange(sm.id, 'away', 2, e.target.value)} style={{ flex: 1, backgroundColor: '#334155', color: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #475569', fontSize: '12px' }}>
                        <option value="">-- Spelare 2 --</option>
                        {matchData.awayRoster.filter(Boolean).map((p, i) => <option key={i} value={p}>{p}</option>)}
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
                  <input type="number" min="0" max="3" value={sm.homeScore} onChange={(e) => handleSubMatchChange(sm.id, 'homeScore', e.target.value)} style={{ width: '45px', backgroundColor: '#0f172a', color: '#fcd34d', border: '1px solid #475569', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', padding: '2px' }} />
                  <span>-</span>
                  <input type="number" min="0" max="3" value={sm.awayScore} onChange={(e) => handleSubMatchChange(sm.id, 'awayScore', e.target.value)} style={{ width: '45px', backgroundColor: '#0f172a', color: '#fcd34d', border: '1px solid #475569', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', padding: '2px' }} />
                  <select value={sm.status} onChange={(e) => handleSubMatchChange(sm.id, 'status', e.target.value)} style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '4px', padding: '3px 6px' }}>
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
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}>BEFINTLIGA PRESTATIONER ({(matchData.performances || []).length}):</div>
          {(matchData.performances || []).length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Inga prestationer registrerade ännu.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(matchData.performances || []).map((p, idx) => (
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

// --- 2. PUBLIK VY ---
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
      
      {/* SCOREBOARD BANNER (TV SHOW SCOREBOARD) */}
      <div style={{
        backgroundColor: '#090d16',
        borderRadius: '20px',
        border: '2px solid #1e293b',
        padding: '24px 30px',
        marginBottom: '25px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* HEMMALAG HEADER */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>HEMMALAG</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa', textShadow: '0 0 12px rgba(96, 165, 250, 0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {matchData.homeTeam || 'Hemmalag'}
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
              Legs: <strong style={{ color: '#38bdf8', fontSize: '16px' }}>{homeTotalLegs}</strong>
            </div>
          </div>

          {/* STÄLLNING CENTER PIECE */}
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

          {/* BORTALAG HEADER */}
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

      {/* DELMATCHEN I TV-GRID */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
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
                {/* LIVE BADGE INDIKATOR */}
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

                {/* MATCH INNEHÅLL */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  
                  {/* ID & HEMMASPELARE */}
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

                  {/* MITTEN - POÄNG/RESULTAT */}
                  {isLive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 8px' }}>
                      <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '18px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569' }}>
                        {sm.homeScore}
                      </div>
                      
                      {/* HEMMAPOÄNG */}
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

                      {/* BORTAPOÄNG */}
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

                  {/* BORTASPELARE */}
                  <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderPlayerName(sm.awayPlayer, isAwayWinner, isAwayLoser, false, awayStarts)}
                  </div>
                </div>
              </div>

              {/* MELLANRUM MELLAN BLOCKEN */}
              {isBlockGap && (
                <div style={{ height: '16px' }} />
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

// --- 3. HUVUDKOMPONENT (App) ---
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
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', padding: '15px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('public')}
          style={{
            backgroundColor: activeTab === 'public' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          📺 Publikvy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          style={{
            backgroundColor: activeTab === 'admin' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ⚙️ Admin
        </button>
      </div>
      {activeTab === 'public' && (
        <PublicView matchData={matchData} />
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
