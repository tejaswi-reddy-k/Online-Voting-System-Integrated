import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import type { ElectionResults } from '../types';
import { getElectionStatus, isVoteCountLive } from '../types';
import { useStore } from '../store/useStore';
import { 
  BarChart3, Users, Award, CheckCircle, Radio, Zap,
  Clock, Lock, ArrowRight, Trophy, Sparkles
} from 'lucide-react';

export const LiveResults: React.FC = () => {
  const { elections, selectedElectionId: storeElectionId, setSelectedElectionId: setStoreElectionId, setActiveTab } = useStore();
  const selectedElectionId = storeElectionId || elections[0]?.id || 1;
  const [streamStatus, setStreamStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastStreamTime, setLastStreamTime] = useState<string>('Connecting...');
  const [liveResults, setLiveResults] = useState<ElectionResults | null>(null);
  const [recentlyUpdatedCandidateId, setRecentlyUpdatedCandidateId] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const currentElection = elections.find(e => e.id === selectedElectionId) || elections[0];
  const currentStatus = currentElection ? getElectionStatus(currentElection) : 'UPCOMING';
  const isLiveCounting = currentElection ? isVoteCountLive(currentElection) : false;

  // Connect to SSE Live Result Stream ONLY when in COUNTING phase (after voting closes and before results announced)
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (!currentElection || !isLiveCounting) {
      setStreamStatus('disconnected');
      return;
    }

    const sseUrl = apiService.getStreamResultsUrl(currentElection.id);
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStreamStatus('connected');
      setLastStreamTime(new Date().toLocaleTimeString());
    };

    es.addEventListener('results', (event: MessageEvent) => {
      try {
        const payload: ElectionResults = JSON.parse(event.data);
        setLiveResults(prev => {
          if (prev && prev.results && payload.results) {
            for (const cand of payload.results) {
              const oldCand = prev.results.find(c => c.id === cand.id);
              if (oldCand && cand.voteCount > oldCand.voteCount) {
                setRecentlyUpdatedCandidateId(cand.id);
                setTimeout(() => setRecentlyUpdatedCandidateId(null), 1800);
                break;
              }
            }
          }
          return payload;
        });
        setStreamStatus('connected');
        setLastStreamTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to parse SSE live result payload:", err);
      }
    });

    es.onerror = () => {
      setStreamStatus('disconnected');
    };

    return () => {
      es.close();
    };
  }, [currentElection?.id, isLiveCounting]);

  if (!currentElection) {
    return (
      <div style={{ maxWidth: '980px', margin: '2rem auto', textAlign: 'center' }} className="glass-panel">
        <p style={{ padding: '3rem', color: 'var(--text-muted)' }}>No elections available for live audit.</p>
      </div>
    );
  }

  // Candidates list merged with live stream tallies
  const displayCandidates = (currentElection.candidates || []).map(candidate => {
    if (liveResults && liveResults.electionId === currentElection.id) {
      const liveCand = liveResults.results.find(r => r.id === candidate.id);
      if (liveCand) {
        return {
          ...candidate,
          voteCount: liveCand.voteCount,
          percentage: liveCand.percentage
        };
      }
    }
    return candidate;
  });

  const totalVotes = liveResults && liveResults.electionId === currentElection.id
    ? liveResults.totalVotes
    : displayCandidates.reduce((acc, c) => acc + (c.voteCount || 0), 0);

  const sortedCandidates = [...displayCandidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const winner = sortedCandidates[0];

  return (
    <div style={{ maxWidth: '980px', margin: '2rem auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <BarChart3 size={26} color="#fb923c" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Electoral Counting Center & Live Broadcast</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Official round-wise vote count streams broadcast live after voting closes and before final results are announced.
            </p>
          </div>

          {/* Dynamic Stream Badge based on exact phase */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            {currentStatus === 'COUNTING' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#f87171'
              }}>
                <Radio size={14} className="pulse-indicator" color="#ef4444" />
                <span>LIVE VOTE COUNT STREAM ACTIVE</span>
              </div>
            )}

            {currentStatus === 'ONGOING' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#4ade80'
              }}>
                <Lock size={13} color="#4ade80" />
                <span>VOTING IN PROGRESS • COUNTS SEALED</span>
              </div>
            )}

            {currentStatus === 'COMPLETED' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#facc15'
              }}>
                <Trophy size={13} color="#facc15" />
                <span>OFFICIAL RESULTS ANNOUNCED</span>
              </div>
            )}

            {currentStatus === 'UPCOMING' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8'
              }}>
                <Clock size={13} color="#38bdf8" />
                <span>UPCOMING BALLOT</span>
              </div>
            )}

            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {currentStatus === 'COUNTING'
                ? `Stream: ${streamStatus.toUpperCase()} (${lastStreamTime})`
                : `Status: ${currentStatus}`}
            </span>
          </div>
        </div>

        {/* Election Selector bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#fb923c" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Election:</span>
          </div>
          <select 
            value={currentElection.id}
            onChange={(e) => {
              const newId = Number(e.target.value);
              setStoreElectionId(newId);
            }}
            className="input-control"
            style={{ maxWidth: '440px', cursor: 'pointer' }}
          >
            {elections.map(el => {
              const elStatus = getElectionStatus(el);
              return (
                <option key={el.id} value={el.id}>
                  [{elStatus === 'COUNTING' ? 'LIVE COUNT' : (elStatus === 'ONGOING' ? 'VOTING' : elStatus)}] {el.title}
                </option>
              );
            })}
          </select>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: ONGOING (VOTING ACTIVE) - VOTE COUNTS ARE SEALED, NO LIVE STREAM  */}
        {/* ========================================================================= */}
        {currentStatus === 'ONGOING' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#fb923c', marginBottom: '0.6rem' }}>
                <Lock size={22} color="#fb923c" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  Voting is Active — Live Vote Count Streams After Voting Closes
                </h3>
              </div>

              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                In compliance with Election Commission regulations, vote counts are strictly sealed while polling is underway to ensure an unbiased and confidential electoral process.
              </p>

              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '1rem 1.4rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                fontSize: '0.85rem',
                marginBottom: '1.4rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Voting Closes On:</span>
                  <div style={{ fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
                    {new Date(currentElection.endTime).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Live Stream Scheduled:</span>
                  <div style={{ fontWeight: 800, color: '#fb923c', marginTop: '0.2rem' }}>
                    Immediately Upon Polling Closure
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                  <div style={{ fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>
                    EVM Electronic Ballots Open for Electors
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                  }}
                >
                  <span>Go to Elections Home & Cast Ballot</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Contesting Candidates on Ballot (Names, Parties, Manifestos without unsealed vote tallies) */}
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                Nominated Candidates Contesting in this Ballot ({displayCandidates.length}):
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {displayCandidates.map(c => (
                  <div key={c.id} className="glass-panel" style={{ padding: '1.2rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
                      <img src={c.photoUrl} alt={c.name} style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 600 }}>{c.party}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {c.manifesto}
                    </p>
                    <div style={{ marginTop: '0.8rem', fontSize: '0.72rem', color: '#64748b' }}>
                      Ballot Count: Sealed until {new Date(currentElection.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: COUNTING (VOTING CLOSED & BEFORE RESULTS ANNOUNCED) - LIVE STREAM!*/}
        {/* ========================================================================= */}
        {currentStatus === 'COUNTING' && (
          <div>
            {/* Live Counting Alert Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '16px',
              padding: '1.8rem 2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f87171', marginBottom: '0.4rem' }}>
                <Radio size={20} className="pulse-indicator" color="#ef4444" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em' }}>
                  OFFICIAL LIVE VOTE COUNTING STREAM IN PROGRESS
                </span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                {currentElection.title}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Voting closed at <strong>{new Date(currentElection.endTime).toLocaleString()}</strong>. Round-wise EVM ballot audit and counting is actively broadcasting live in real time before official results announcement.
              </p>
            </div>

            {/* Aggregate Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} /> Total Ballots Counted
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#fb923c' }}>
                  {totalVotes.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} color="#38bdf8" /> Official Election
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: '#38bdf8' }}>
                  {currentElection.title}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Radio size={16} color="#ef4444" /> Counting Stage
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', color: '#f87171' }}>
                  Live Round-Wise Counting
                </div>
              </div>
            </div>

            {/* Candidate Live Stream Tallies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {sortedCandidates.map((c, idx) => {
                const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0';
                const isLeader = idx === 0 && totalVotes > 0;
                const isPulsing = recentlyUpdatedCandidateId === c.id;

                return (
                  <div key={c.id} style={{
                    background: isPulsing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 22, 36, 0.7)',
                    padding: '1.4rem',
                    borderRadius: '14px',
                    border: isPulsing 
                      ? '1px solid #22c55e' 
                      : isLeader 
                      ? '1px solid rgba(249, 115, 22, 0.4)' 
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.4s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <img 
                          src={c.photoUrl} 
                          alt={c.name}
                          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{c.name}</span>
                            {isLeader && (
                              <span style={{
                                background: 'rgba(249, 115, 22, 0.2)',
                                color: '#fb923c',
                                padding: '0.15rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                <Award size={13} /> CURRENT LEADER
                              </span>
                            )}
                            {isPulsing && (
                              <span style={{
                                background: 'rgba(34, 197, 94, 0.25)',
                                color: '#4ade80',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}>
                                +1 NEW ROUND TALLY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>{c.party}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{percentage}%</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.voteCount.toLocaleString()} votes</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: isLeader 
                          ? 'linear-gradient(90deg, #f97316 0%, #22c55e 100%)' 
                          : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                        borderRadius: '9999px',
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: COMPLETED (RESULTS OFFICIALLY ANNOUNCED & CERTIFIED)              */}
        {/* ========================================================================= */}
        {currentStatus === 'COMPLETED' && (
          <div>
            {/* Winner Spotlight Banner */}
            {winner && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(10, 14, 23, 0.95) 100%)',
                border: '2px solid rgba(234, 179, 8, 0.45)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <img 
                    src={winner.photoUrl} 
                    alt={winner.name}
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #facc15'
                    }}
                  />
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#fde047',
                      padding: '0.2rem 0.7rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginBottom: '0.4rem'
                    }}>
                      <Sparkles size={13} /> OFFICIAL ELECTION WINNER • CERTIFIED
                    </div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{winner.name}</h3>
                    <div style={{ fontSize: '0.95rem', color: '#facc15', fontWeight: 700 }}>{winner.party}</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  padding: '1rem 1.8rem',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#facc15' }}>
                    {winner.voteCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    CERTIFIED VOTES ({totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </div>
            )}

            {/* Note that Live Stream is Concluded */}
            <div style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              padding: '0.9rem 1.2rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              color: '#fef08a',
              marginBottom: '1.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <CheckCircle size={18} color="#facc15" />
              <span>Live counting stream concluded. Official audited results have been declared by the Election Commission.</span>
            </div>

            {/* Final Certified Candidate Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedCandidates.map((c, idx) => {
                const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0';
                const isWinner = idx === 0 && totalVotes > 0;

                return (
                  <div key={c.id} style={{
                    background: isWinner ? 'rgba(234, 179, 8, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isWinner ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <img src={c.photoUrl} alt={c.name} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color: isWinner ? '#facc15' : 'var(--text-muted)' }}>{c.party}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isWinner ? '#facc15' : '#ffffff' }}>
                        {c.voteCount.toLocaleString()} votes
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{percentage}% of certified ballots</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 4: UPCOMING (NOT STARTED YET)                                       */}
        {/* ========================================================================= */}
        {currentStatus === 'UPCOMING' && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <Clock size={44} color="#38bdf8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Election Scheduled</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0.4rem auto 1.4rem' }}>
              Voting has not started yet. Polling window will open on <strong>{new Date(currentElection.startTime).toLocaleString()}</strong>. The live counting stream will activate after voting closes.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
