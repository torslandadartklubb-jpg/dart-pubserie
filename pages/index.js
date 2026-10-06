if (typeof window !== 'undefined') {
  window.addEventListener('error', function(e) {
    alert('Krasch: ' + e.message + ' i ' + e.filename + ':' + e.lineno);
  });
}
import React, { useState, useRef, useEffect } from 'react';
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
const HOME_STARTS_MATCHES = ['S1', 'D1', 'S4', 'S6', 'S7'];
const IMPOSSIBLE_SCORES = [163, 166, 169, 172, 173, 175, 176, 178, 179];
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

// --- 2. DOMAR VY ---
function N01Scorer({ match, homeTeam, awayTeam, onBack, onSave, onLiveUpdate }) {
  const initialHome = match.currentHomePoints !== undefined ? match.currentHomePoints : 501;
  const initialAway = match.currentAwayPoints !== undefined ? match.currentAwayPoints : 501;
  const [homeScore, setHomeScore] = useState(initialHome);
  const [awayScore, setAwayScore] = useState(initialAway);
  const [homeLegs, setHomeLegs] = useState(match.homeScore || 0);
  const [awayLegs, setAwayLegs] = useState(match.awayScore || 0);
  const [status, setStatus] = useState(match.status || 'live');
  const [inputVal, setInputVal] = useState('');
  const getInitialStarter = () => {
    if (match.id === 'AD') return null;
    return HOME_STARTS_MATCHES.indexOf(match.id) !== -1 ? 'home' : 'away';
  };
  const [legStarter, setLegStarter] = useState(getInitialStarter);
  const [turn, setTurn] = useState(getInitialStarter);
  const [historyStack, setHistoryStack] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [confirmCheckout, setConfirmCheckout] = useState(null);
  const [confirmRemaining, setConfirmRemaining] = useState(null);
  const [scoringActive, setScoringActive] = useState(false);
  const [scoringHomeInput, setScoringHomeInput] = useState('');
  const [scoringAwayInput, setScoringAwayInput] = useState('');
  const [scoringConfirm, setScoringConfirm] = useState(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (match.status !== 'completed' && status !== 'live') {
      setStatus('live');
    }
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [rounds, turn]);

  useEffect(() => {
    if (onLiveUpdate) {
      const currentStatus = (homeLegs === 3 || awayLegs === 3) ? 'completed' : 'live';
      onLiveUpdate(match.id, {
        homeScore: homeLegs,
        awayScore: awayLegs,
        currentHomePoints: homeScore,
        currentAwayPoints: awayScore,
        status: currentStatus
      }, performances);
    }
  }, [homeLegs, awayLegs, homeScore, awayScore, performances, status]);

  const homeName = match.homePlayer || homeTeam;
  const awayName = match.awayPlayer || awayTeam;
  const isMatchFinished = homeLegs === 3 || awayLegs === 3;
  const activePlayerName = turn === 'home' ? homeName : awayName;

  const recalculateRoundsAndScores = (currentRounds) => {
    let currentHome = 501;
    let currentAway = 501;
    const updatedRounds = currentRounds.map((r) => {
      let newHomeEntry = r.home;
      let newAwayEntry = r.away;
      if (r.home) {
        const score = r.home.rawScore;
        let rem = currentHome - score;
        let isBust = rem < 0 || rem === 1 || (rem === 0 && (IMPOSSIBLE_CHECKOUTS.indexOf(score) !== -1 || score > 170));
        if (isBust) {
          rem = currentHome;
        } else {
          currentHome = rem;
        }
        newHomeEntry = {
          rawScore: score,
          score: isBust ? 'BUST' : score,
          remaining: rem
        };
      }
      if (r.away) {
        const score = r.away.rawScore;
        let rem = currentAway - score;
        let isBust = rem < 0 || rem === 1 || (rem === 0 && (IMPOSSIBLE_CHECKOUTS.indexOf(score) !== -1 || score > 170));
        if (isBust) {
          rem = currentAway;
        } else {
          currentAway = rem;
        }
        newAwayEntry = {
          rawScore: score,
          score: isBust ? 'BUST' : score,
          remaining: rem
        };
      }
      return Object.assign({}, r, {
        home: newHomeEntry,
        away: newAwayEntry
      });
    });
    return {
      updatedRounds: updatedRounds,
      newHomeScore: currentHome,
      newAwayScore: currentAway
    };
  };

  const handleNumClick = (num) => {
    if (isMatchFinished || !turn) return;
    if (inputVal.length < 3) setInputVal(function(prev) { return prev + num; });
  };

  const handleClear = () => setInputVal('');

  const saveStateToHistory = () => {
    setHistoryStack(function(prev) {
      return prev.concat([{
        homeScore: homeScore, awayScore: awayScore, homeLegs: homeLegs, awayLegs: awayLegs, turn: turn, legStarter: legStarter, rounds: rounds, performances: performances, status: status
      }]);
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastState = historyStack[historyStack.length - 1];
    setHomeScore(lastState.homeScore);
    setAwayScore(lastState.awayScore);
    setHomeLegs(lastState.homeLegs);
    setAwayLegs(lastState.awayLegs);
    setTurn(lastState.turn);
    setLegStarter(lastState.legStarter);
    setRounds(lastState.rounds);
    setPerformances(lastState.performances);
    setStatus(lastState.status);
    setInputVal('');
    setScoringActive(false);
    setScoringConfirm(null);
    setConfirmRemaining(null);
  };

  const handleEnterScore = () => {
    if (isMatchFinished || !turn) return;
    const score = parseInt(inputVal || '0', 10);
    if (isNaN(score) || score > 180) {
      alert('Ange en giltig poäng mellan 0 och 180.');
      return;
    }
    if (IMPOSSIBLE_SCORES.indexOf(score) !== -1) {
      alert('Det går inte att få ' + score + ' poäng på 3 pilar!');
      setInputVal('');
      return;
    }
    if (status !== 'completed') {
      setStatus('live');
    }
    const currentScore = turn === 'home' ? homeScore : awayScore;
    const remaining = currentScore - score;

    if (remaining === 0) {
      if (IMPOSSIBLE_CHECKOUTS.indexOf(score) !== -1 || score > 170) {
        processScore(score);
        return;
      }
      setConfirmCheckout({ score: score, player: activePlayerName, team: turn });
      return;
    }
    processScore(score);
  };

  const handleOpenRemainingModal = () => {
    if (isMatchFinished || !turn || !inputVal) return;
    const targetRemaining = parseInt(inputVal, 10);
    const currentScore = turn === 'home' ? homeScore : awayScore;

    if (isNaN(targetRemaining) || targetRemaining < 0 || targetRemaining >= currentScore) {
      alert('Återstående poäng måste vara mindre än nuvarande poäng (' + currentScore + ').');
      return;
    }

    const calculatedScored = currentScore - targetRemaining;

    if (calculatedScored > 180) {
      alert('Detta innebär att spelaren kastat ' + calculatedScored + ' poäng, vilket är över max 180.');
      return;
    }

    if (IMPOSSIBLE_SCORES.indexOf(calculatedScored) !== -1) {
      alert('Detta innebär att spelaren kastat ' + calculatedScored + ' poäng, vilket är ett omöjligt kast.');
      return;
    }

    setConfirmRemaining({ targetRemaining: targetRemaining, calculatedScored: calculatedScored, player: activePlayerName });
  };

  const processRemainingScore = () => {
    if (!confirmRemaining) return;
    const calculatedScored = confirmRemaining.calculatedScored;
    setConfirmRemaining(null);

    if (status !== 'completed') {
      setStatus('live');
    }

    const currentScore = turn === 'home' ? homeScore : awayScore;
    const remaining = currentScore - calculatedScored;

    if (remaining === 0) {
      if (IMPOSSIBLE_CHECKOUTS.indexOf(calculatedScored) !== -1 || calculatedScored > 170) {
        processScore(calculatedScored);
        return;
      }
      setConfirmCheckout({ score: calculatedScored, player: activePlayerName, team: turn });
      return;
    }
    processScore(calculatedScored);
  };

  const processScore = (score, confirmedCheckout) => {
    saveStateToHistory();
    const currentScore = turn === 'home' ? homeScore : awayScore;
    let newScore = currentScore - score;
    let isBust = false;

    if (newScore < 0 || newScore === 1 || (newScore === 0 && (IMPOSSIBLE_CHECKOUTS.indexOf(score) !== -1 || score > 170))) {
      isBust = true;
      newScore = currentScore;
    }

    if (score === 180 && !isBust) {
      setPerformances(function(prev) { return prev.concat([{ id: Date.now(), team: turn, player: activePlayerName, text: '180' }]); });
    }

    const entryData = {
      rawScore: score,
      score: isBust ? 'BUST' : score,
      remaining: newScore
    };

    if (turn === 'home') {
      const updatedRounds = rounds.concat([{ round: (rounds.length + 1) * 3, home: entryData, away: null }]);
      setRounds(updatedRounds);

      if (confirmedCheckout) {
        checkAndAddCheckoutPerformances('home', activePlayerName, score, updatedRounds.length);
        const newHomeLegs = homeLegs + 1;
        setHomeLegs(newHomeLegs);
        if (newHomeLegs === 3) setStatus('completed');
        startNextLeg();
        setInputVal('');
        return;
      }

      setHomeScore(newScore);
      setTurn('away');
    } else {
      let updatedRounds;
      if (rounds.length === 0) {
        updatedRounds = [{ round: 3, home: null, away: entryData }];
      } else if (rounds[rounds.length - 1].away === null) {
        updatedRounds = rounds.map((r, i) => i === rounds.length - 1 ? Object.assign({}, r, { away: entryData }) : r);
      } else {
        updatedRounds = rounds.concat([{ round: (rounds.length + 1) * 3, home: null, away: entryData }]);
      }
      setRounds(updatedRounds);

      if (confirmedCheckout) {
        checkAndAddCheckoutPerformances('away', activePlayerName, score, updatedRounds.length);
        const newAwayLegs = awayLegs + 1;
        setAwayLegs(newAwayLegs);
        if (newAwayLegs === 3) setStatus('completed');
        startNextLeg();
        setInputVal('');
        return;
      }

      setAwayScore(newScore);

      if (updatedRounds.length === 13) {
        setScoringActive(true);
        setInputVal('');
        return;
      }

      setTurn('home');
    }
    setInputVal('');
  };

  const checkAndAddCheckoutPerformances = (team, player, checkoutScore, roundsCount) => {
    const totalDarts = roundsCount * 3;
    const newPerfs = [];
    if (checkoutScore >= 100) {
      newPerfs.push({ id: Date.now() + 1, team: team, player: player, text: checkoutScore + ' ut' });
    }
    if (totalDarts <= 15) {
      newPerfs.push({ id: Date.now() + 2, team: team, player: player, text: totalDarts + ' pilars leg' });
    }
    if (newPerfs.length > 0) {
      setPerformances(function(prev) { return prev.concat(newPerfs); });
    }
  };

  const handleScoringSubmit = () => {
    const hVal = parseInt(scoringHomeInput, 10);
    const aVal = parseInt(scoringAwayInput, 10);

    if (isNaN(hVal) || hVal < 0 || hVal > 180 || IMPOSSIBLE_SCORES.indexOf(hVal) !== -1) {
      alert('Ogiltig poäng för ' + homeName + '.');
      return;
    }
    if (isNaN(aVal) || aVal < 0 || aVal > 180 || IMPOSSIBLE_SCORES.indexOf(aVal) !== -1) {
      alert('Ogiltig poäng för ' + awayName + '.');
      return;
    }
    if (hVal === aVal) {
      alert('Det blev oavgjort! Scoring måste ge en vinnare (kasta igen vid oavgjort).');
      return;
    }

    const winner = hVal > aVal ? 'home' : 'away';
    const winnerName = winner === 'home' ? homeName : awayName;
    setScoringConfirm({ winner: winner, winnerName: winnerName, homeVal: hVal, awayVal: aVal });
  };

  const confirmScoringWinner = () => {
    if (!scoringConfirm) return;
    if (scoringConfirm.winner === 'home') {
      const newLegs = homeLegs + 1;
      setHomeLegs(newLegs);
      if (newLegs === 3) setStatus('completed');
    } else {
      const newLegs = awayLegs + 1;
      setAwayLegs(newLegs);
      if (newLegs === 3) setStatus('completed');
    }
    setScoringActive(false);
    setScoringConfirm(null);
    setScoringHomeInput('');
    setScoringAwayInput('');
    startNextLeg();
  };

  const cancelScoringConfirm = () => {
    setScoringConfirm(null);
  };

  const startNextLeg = () => {
    const nextStarter = legStarter === 'home' ? 'away' : 'home';
    setHomeScore(501);
    setAwayScore(501);
    setRounds([]);
    setLegStarter(nextStarter);
    setTurn(nextStarter);
  };

  const handleEditRound = (index, team) => {
    const targetRound = rounds[index];
    const currentEntry = team === 'home' ? targetRound.home : targetRound.away;
    if (!currentEntry) return;

    const currentVal = currentEntry.rawScore;
    const newValStr = prompt('Ändra kastad poäng för omgång ' + (index + 1) + ':', currentVal);
    if (newValStr === null) return;

    const newVal = parseInt(newValStr, 10);
    if (isNaN(newVal) || newVal < 0 || newVal > 180 || IMPOSSIBLE_SCORES.indexOf(newVal) !== -1) {
      alert('Ogiltig poäng.');
      return;
    }

    saveStateToHistory();
    const rawRounds = rounds.map((r, i) => {
      if (i === index) {
        var updatedTeam = Object.assign({}, r[team], { rawScore: newVal });
        var obj = {};
        obj[team] = updatedTeam;
        return Object.assign({}, r, obj);
      }
      return r;
    });

    const res = recalculateRoundsAndScores(rawRounds);
    setRounds(res.updatedRounds);
    setHomeScore(res.newHomeScore);
    setAwayScore(res.newAwayScore);
  };

  const renderCellContent = (entry) => {
    if (!entry) return '';
    if (entry.score === 'BUST') {
      return (
        <span>
          <span style={{ color: '#f43f5e' }}>BUST</span>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '6px' }}>({entry.remaining})</span>
        </span>
      );
    }
    return (
      <span>
        <span style={{ color: '#fcd34d' }}>{entry.score}</span>
        <span style={{ fontSize: '14px', color: '#38bdf8', marginLeft: '6px', fontWeight: 'normal' }}>({entry.remaining})</span>
      </span>
    );
  };

  if (!turn && match.id === 'AD') {
    return (
      <div style={{ maxWidth: '500px', margin: '20px auto', backgroundColor: '#020617', padding: '25px', borderRadius: '16px', textAlign: 'center', border: '2px solid #eab308' }}>
        <h2 style={{ color: '#eab308', fontSize: '22px', marginBottom: '10px' }}>AVGÖRANDE DUBBEL (AD)</h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '20px' }}>Vem vann slantkastningen / omkastet och ska börja?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={() => { setLegStarter('home'); setTurn('home'); setStatus('live'); }} style={{ backgroundColor: '#1e293b', color: '#60a5fa', border: '2px solid #3b82f6', padding: '20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
            {homeName}
          </button>
          <button onClick={() => { setLegStarter('away'); setTurn('away'); setStatus('live'); }} style={{ backgroundColor: '#1e293b', color: '#f43f5e', border: '2px solid #f43f5e', padding: '20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
            {awayName}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '550px', margin: '0 auto', backgroundColor: '#020617', color: '#fff', padding: '12px', borderRadius: '16px', border: '1px solid #1e293b', fontFamily: 'sans-serif', userSelect: 'none' }}>
      {confirmCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #10b981', borderRadius: '16px', padding: '24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎯</div>
            <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px 0' }}>Gick spelaren ut?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '20px' }}>
              <strong style={{ color: '#34d399' }}>{confirmCheckout.player}</strong> har knappat in <strong>{confirmCheckout.score}</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => { const score = confirmCheckout.score; setConfirmCheckout(null); processScore(score, true); }} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                JA (Vann leg)
              </button>
              <button onClick={() => setConfirmCheckout(null)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                NEJ (Fel)
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRemaining && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 105, padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #3b82f6', borderRadius: '16px', padding: '24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>✏️️</div>
            <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 10px 0' }}>Sätt kvarvarande poäng?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '15px' }}>
              Sätt <strong style={{ color: '#60a5fa' }}>{confirmRemaining.player}s</strong> kvarvarande poäng till <strong style={{ color: '#fcd34d', fontSize: '20px' }}>{confirmRemaining.targetRemaining}</strong>?
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '6px' }}>
              (Detta innebär en registrering av <strong>{confirmRemaining.calculatedScored}</strong> poäng)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={processRemainingScore} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                JA (Registrera)
              </button>
              <button onClick={() => setConfirmRemaining(null)} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                NEJ (Avbryt)
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={onBack} style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Tillbaka
        </button>
        <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px' }}>Match {match.id} ({match.type === 'single' ? 'Singel' : 'Dubbel'})</span>
        <button onClick={() => onSave({ homeScore: homeLegs, awayScore: awayLegs, currentHomePoints: homeScore, currentAwayPoints: awayScore, status: isMatchFinished ? 'completed' : 'live' }, performances)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
          Spara & Stäng
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{ backgroundColor: turn === 'home' ? '#1e293b' : '#0f172a', padding: '12px', borderRadius: '12px', border: turn === 'home' ? '2px solid #3b82f6' : '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'home' ? '#60a5fa' : '#cbd5e1', lineHeight: '1' }}>{homeScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold', marginTop: '6px' }}>Legs: {homeLegs}</div>
        </div>
        <div style={{ backgroundColor: turn === 'away' ? '#1e293b' : '#0f172a', padding: '12px', borderRadius: '12px', border: turn === 'away' ? '2px solid #f43f5e' : '1px solid #1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayName}</div>
          <div style={{ fontSize: '42px', fontWeight: '900', color: turn === 'away' ? '#f43f5e' : '#cbd5e1', lineHeight: '1' }}>{awayScore}</div>
          <div style={{ fontSize: '14px', color: '#fcd34d', fontWeight: 'bold', marginTop: '6px' }}>Legs: {awayLegs}</div>
        </div>
      </div>

      <div ref={logContainerRef} style={{ height: '140px', overflowY: 'auto', backgroundColor: '#090d16', borderRadius: '8px', padding: '8px', marginBottom: '12px', border: '1px solid #1e293b' }}>
        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b' }}>
              <th style={{ paddingBottom: '4px' }}>Hemmaspelare</th>
              <th style={{ paddingBottom: '4px', width: '50px' }}>Pil</th>
              <th style={{ paddingBottom: '4px' }}>Bortaspelare</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                <td onClick={() => handleEditRound(i, 'home')} style={{ padding: '4px', cursor: 'pointer' }}>{renderCellContent(r.home)}</td>
                <td style={{ color: '#475569', fontSize: '11px' }}>{r.round}</td>
                <td onClick={() => handleEditRound(i, 'away')} style={{ padding: '4px', cursor: 'pointer' }}>{renderCellContent(r.away)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isMatchFinished && !scoringActive && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', border: '1px solid #334155' }}>
              {inputVal || '0'}
            </div>
            <button onClick={handleOpenRemainingModal} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
              Sätt kvar
            </button>
            <button onClick={handleUndo} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
              Ångra
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => handleNumClick(num.toString())} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                {num}
              </button>
            ))}
            <button onClick={handleClear} style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '14px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              C
            </button>
            <button onClick={() => handleNumClick('0')} style={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
              0
            </button>
            <button onClick={handleEnterScore} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {scoringActive && (
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '2px solid #eab308' }}>
          <h3 style={{ color: '#eab308', margin: '0 0 10px 0', fontSize: '16px', textAlign: 'center' }}>SCORING (Leg avgörs med flest poäng)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>{homeName}</label>
              <input type="number" placeholder="Poäng" value={scoringHomeInput} onChange={(e) => setScoringHomeInput(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8' }}>{awayName}</label>
              <input type="number" placeholder="Poäng" value={scoringAwayInput} onChange={(e) => setScoringAwayInput(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={handleScoringSubmit} style={{ width: '100%', backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Registrera Scoring
          </button>
        </div>
      )}

      {scoringConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #eab308', borderRadius: '16px', padding: '24px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 10px 0' }}>Bekräfta Scoring-vinnare</h3>
            <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '20px' }}>
              Vinnare av legget är <strong style={{ color: '#fcd34d' }}>{scoringConfirm.winnerName}</strong> ({scoringConfirm.homeVal} vs {scoringConfirm.awayVal}).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={confirmScoringWinner} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Godkänn
              </button>
              <button onClick={cancelScoringConfirm} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. PUBLIK VY (NY TV-ANPASSD DESIGN) ---
function PublicView({ matchData, onSelectMatch }) {
  const subMatches = matchData.subMatches || [];
  const homeTotalMatches = subMatches.filter(m => m.homeScore === 3).length;
  const awayTotalMatches = subMatches.filter(m => m.awayScore === 3).length;
  const homeTotalLegs = subMatches.reduce((sum, m) => sum + (m.homeScore || 0), 0);
  const awayTotalLegs = subMatches.reduce((sum, m) => sum + (m.awayScore || 0), 0);

  const renderPlayerName = (name, isWinner, isLoser, isHome) => {
    const displayName = name || (isHome ? matchData.homeTeam : matchData.awayTeam) || 'Spelare';
    if (isWinner) {
      return (
        <span style={{ fontSize: '17px', fontWeight: '900', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isHome && <span>🏆</span>}
          <span>{displayName}</span>
          {!isHome && <span>🏆</span>}
        </span>
      );
    }
    if (isLoser) {
      return (
        <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#64748b', opacity: 0.8 }}>
          {displayName}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>
        {displayName}
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

      {/* DELMATCHEN I TV-GRID (2 KOLUMNER FÖR optimal 16:9 VY) */}
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

          return (
            <button
              key={sm.id}
              type="button"
              onClick={() => onSelectMatch(sm)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                backgroundColor: isLive ? '#0a1329' : isCompleted ? '#0f172a' : '#1e293b',
                borderRadius: '16px',
                padding: isLive ? '18px 20px' : '14px 18px',
                border: isLive ? '2px solid #22c55e' : isCompleted ? '1px solid #334155' : '1px solid #1e293b',
                boxShadow: isLive ? '0 0 20px rgba(34, 197, 94, 0.25)' : 'none',
                cursor: 'pointer',
                color: 'inherit',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out'
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
                    color: '#eab308',
                    backgroundColor: '#020617',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    minWidth: '28px',
                    textAlign: 'center'
                  }}>
                    {sm.id}
                  </span>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderPlayerName(sm.homePlayer, isHomeWinner, isHomeLoser, true)}
                  </div>
                </div>

                {/* MITTEN - POÄNG/RESULTAT */}
                {isLive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 8px' }}>
                    <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '18px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569' }}>
                      {sm.homeScore}
                    </div>
                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '28px', fontWeight: '900', padding: '6px 14px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '75px', textAlign: 'center', boxShadow: '0 0 10px rgba(255, 238, 0, 0.3)' }}>
                      {sm.currentHomePoints}
                    </div>
                    <span style={{ color: '#475569', fontWeight: 'bold', fontSize: '12px' }}>VS</span>
                    <div style={{ backgroundColor: '#020617', color: '#ffee00', fontSize: '28px', fontWeight: '900', padding: '6px 14px', borderRadius: '8px', border: '2px solid #ffee00', minWidth: '75px', textAlign: 'center', boxShadow: '0 0 10px rgba(255, 238, 0, 0.3)' }}>
                      {sm.currentAwayPoints}
                    </div>
                    <div style={{ backgroundColor: '#1e293b', color: '#fff', fontSize: '18px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569' }}>
                      {sm.awayScore}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ backgroundColor: '#020617', padding: '6px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#fcd34d' : '#64748b' }}>{sm.homeScore}</span>
                      <span style={{ color: '#475569', fontSize: '12px' }}>-</span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: isCompleted ? '#fcd34d' : '#64748b' }}>{sm.awayScore}</span>
                    </div>
                    {isCompleted && (
                      <span style={{ fontSize: '10px', backgroundColor: '#334155', color: '#38bdf8', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        KLAR
                      </span>
                    )}
                  </div>
                )}

                {/* BORTASPELARE */}
                <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {renderPlayerName(sm.awayPlayer, isAwayWinner, isAwayLoser, false)}
                </div>

              </div>
            </button>
          );
        })}
      </div>

      {/* PRESTATIONER TICKER / SHOWCASE (TV STYLE) */}
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

// --- 4. HUVUDKOMPONENT (App) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
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

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    setActiveTab('scorer');
  };

  const handleLiveUpdateFromScorer = (subMatchId, updatedSubMatchData, scorerPerformances) => {
    const updatedMatches = (matchData.subMatches || []).map(sm => sm.id === subMatchId ? Object.assign({}, sm, updatedSubMatchData) : sm);
    
    const existingPerfs = matchData.performances || [];
    const newUniquePerformances = (scorerPerformances || []).filter(function(p) {
      return !existingPerfs.some(function(ep) { return ep.id === p.id; });
    });

    const updatedMatchData = Object.assign({}, matchData, {
      subMatches: updatedMatches,
      performances: existingPerfs.concat(newUniquePerformances)
    });

    saveToSupabase(updatedMatchData);
  };

  const handleSaveMatch = (updatedSubMatchData, newPerformances) => {
    if (!selectedMatch) return;
    const updatedMatches = (matchData.subMatches || []).map(sm => sm.id === selectedMatch.id ? Object.assign({}, sm, updatedSubMatchData) : sm);
    
    const existingPerfs = matchData.performances || [];
    const newUniquePerformances = (newPerformances || []).filter(function(p) {
      return !existingPerfs.some(function(ep) { return ep.id === p.id; });
    });

    const updatedMatchData = Object.assign({}, matchData, {
      subMatches: updatedMatches,
      performances: existingPerfs.concat(newUniquePerformances)
    });

    saveToSupabase(updatedMatchData);
    setActiveTab('public');
    setSelectedMatch(null);
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
        <PublicView matchData={matchData} onSelectMatch={handleSelectMatch} />
      )}

      {activeTab === 'admin' && (
        <AdminView
          matchData={matchData}
          setMatchData={handleAdminSetMatchData}
          isAdminAuthenticated={isAdminAuthenticated}
          setIsAdminAuthenticated={setIsAdminAuthenticated}
        />
      )}

      {activeTab === 'scorer' && selectedMatch && (
        <N01Scorer
          match={selectedMatch}
          homeTeam={matchData.homeTeam}
          awayTeam={matchData.awayTeam}
          onBack={() => { setActiveTab('public'); setSelectedMatch(null); }}
          onSave={handleSaveMatch}
          onLiveUpdate={handleLiveUpdateFromScorer}
        />
      )}
    </div>
  );
}
