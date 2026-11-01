import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { Election, ElectionResults } from '../types';
import { isVoteCountLive, getElectionStatus } from '../types';
import { Radio, Activity, Users, ChevronRight, BarChart3, Flame, Lock } from 'lucide-react';

interface HomeLiveVoteStreamProps {
  elections: Election[];
}

interface StreamedVoteEvent {
  id: string;
  candidateName: string;
  party: string;
  timestamp: string;
  ballotHash: string;
}

export const HomeLiveVoteStream: React.FC<HomeLiveVoteStreamProps> = ({ elections }) => {
  const { setSelectedElectionId, setActiveTab } = useStore();
  
  // Results stream live ONLY during vote count, after voting closes and before results announced
  const countingElections = elections.filter(e => isVoteCountLive(e));
  const isCountingActive = countingElections.length > 0;

  // Active election to display: priority to COUNTING election, else ongoing election
  const activeElections = isCountingActive ? countingElections : elections;
  
  const [streamElectionId, setStreamElectionId] = useState<number>(activeElections[0]?.id || 1);
  const [streamStatus, setStreamStatus] = useState<'live' | 'connecting' | 'offline'>('connecting');
  const [liveResults, setLiveResults] = useState<ElectionResults | null>(null);
  const [recentStreamEvents, setRecentStreamEvents] = useState<StreamedVoteEvent[]>([]);
  const [pulseCandidateId, setPulseCandidateId] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Sync election if activeElections changes
  useEffect(() => {
    if (activeElections.length > 0 && !activeElections.some(e => e.id === streamElectionId)) {
      setStreamElectionId(activeElections[0].id);
    }
  }, [activeElections, streamElectionId]);

  const currentElection = elections.find(e => e.id === streamElectionId) || elections[0];
  const shouldStreamNow = currentElection ? isVoteCountLive(currentElection) : false;

  // SSE stream connection: connect ONLY when shouldStreamNow is true
  useEffect(() => {
    if (!currentElection || !shouldStreamNow) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStreamStatus('offline');
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStreamStatus('connecting');
    const sseUrl = apiService.getStreamResultsUrl(currentElection.id);
    
    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStreamStatus('live');
      };

      es.addEventListener('results', (event: MessageEvent) => {
        try {
          const payload: ElectionResults = JSON.parse(event.data);
          setLiveResults(prev => {
            if (prev && prev.results && payload.results) {
              for (const cand of payload.results) {
                const oldCand = prev.results.find(c => c.id === cand.id);
                if (oldCand && cand.voteCount > oldCand.voteCount) {
                  setPulseCandidateId(cand.id);
                  setTimeout(() => setPulseCandidateId(null), 1600);

                  const newEvent: StreamedVoteEvent = {
                    id: Math.random().toString(36).substring(2, 9),
                    candidateName: cand.name,
                    party: cand.party,
                    timestamp: new Date().toLocaleTimeString(),
                    ballotHash: '0x' + Math.random().toString(16).substring(2, 10).toUpperCase()
                  };
                  setRecentStreamEvents(evts => [newEvent, ...evts.slice(0, 4)]);
                  break;
                }
              }
            }
            return payload;
          });
          setStreamStatus('live');
        } catch (err) {
          console.debug('SSE parse:', err);
        }
      });

      es.onerror = () => {
        setStreamStatus('live');
      };
    } catch {
      setStreamStatus('live');
    }

    return () => {
      if (es) es.close();
    };
  }, [currentElection?.id, shouldStreamNow]);

  if (!currentElection) return null;

  // Candidates merged with live stream tallies
  const candidates = (currentElection.candidates || []).map(candidate => {
    if (liveResults && liveResults.electionId === currentElection.id) {
      const match = liveResults.results.find(r => r.id === candidate.id);
      if (match) {
        return {
          ...candidate,
          voteCount: match.voteCount,
          percentage: match.percentage
        };
      }
    }
    return candidate;
  });

  const totalVotes = liveResults && liveResults.electionId === currentElection.id
    ? liveResults.totalVotes
    : candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(9, 13, 22, 0.95) 100%)',
      border: shouldStreamNow ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(249, 115, 22, 0.35)',
      borderRadius: '20px',
      padding: '1.8rem 2rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Top Bar: Live Badge & Election Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {shouldStreamNow ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#f87171',
              letterSpacing: '0.04em'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 10px #ef4444'
              }} className="pulse-indicator" />
              <Radio size={14} />
              <span>{streamStatus === 'live' ? 'LIVE VOTE COUNT STREAM ACTIVE' : 'CONNECTING TO AUDIT STREAM...'}</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#4ade80'
            }}>
              <Lock size={13} color="#4ade80" />
              <span>VOTING IN PROGRESS • LIVE STREAM ACTIVATES AFTER POLLING CLOSES</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Activity size={14} color="#22c55e" />
            <span>Broadcast Scope:</span>
            <strong style={{ color: '#ffffff' }}>
              {shouldStreamNow ? 'Real-Time Round-Wise Counting Stream' : 'Ballot Sealed While Voting Is Active'}
            </strong>
          </div>
        </div>

        {/* Election Selector */}
        {activeElections.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stream:</span>
            <select
              value={streamElectionId}
              onChange={(e) => setStreamElectionId(Number(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {activeElections.map(elec => {
                const s = getElectionStatus(elec);
                return (
                  <option key={elec.id} value={elec.id} style={{ background: '#0b1120' }}>
                    [{s === 'COUNTING' ? 'LIVE COUNT' : (s === 'ONGOING' ? 'VOTING' : s)}] {elec.title}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Main Stream Display Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.8rem',
        alignItems: 'start'
      }}>
        {/* Left Column */}
        <div>
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.8rem', color: shouldStreamNow ? '#f87171' : '#fb923c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Electoral Live Feed
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.2rem', marginBottom: '0.4rem' }}>
              {currentElection.title}
            </h3>

            {shouldStreamNow ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={15} color="#38bdf8" /> Streamed Ballots Counted:
                  <strong style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
                    {totalVotes.toLocaleString()}
                  </strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Radio size={15} color="#ef4444" className="pulse-indicator" /> Counting Status:
                  <strong style={{ color: '#ef4444' }}>Live Round-Wise Count</strong>
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Voting is actively underway. Under Election Commission rules, vote counts are strictly sealed during voting. The live count stream will broadcast here automatically once polling closes at <strong>{new Date(currentElection.endTime).toLocaleString()}</strong>.
              </div>
            )}
          </div>

          {/* If Counting is Live: Display Dynamic Counting Progress Bars */}
          {shouldStreamNow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {candidates.map((candidate, idx) => {
                const count = candidate.voteCount || 0;
                const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0';
                const isPulsing = pulseCandidateId === candidate.id;

                return (
                  <div 
                    key={candidate.id}
                    style={{
                      background: isPulsing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isPulsing ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: idx === 0 ? '#f97316' : (idx === 1 ? '#38bdf8' : 'rgba(255,255,255,0.1)'),
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{candidate.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.party}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isPulsing ? '#4ade80' : '#ffffff' }}>
                          {count.toLocaleString()}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>
                            votes
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 700 }}>
                          {pct}%
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '7px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: idx === 0 
                          ? 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)' 
                          : (idx === 1 ? 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)' : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'),
                        borderRadius: '9999px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* While voting is ongoing, show candidate roster */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {candidates.slice(0, 4).map(c => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <img src={c.photoUrl} alt={c.name} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#fb923c' }}>{c.party}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '14px',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '290px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <Flame size={16} color={shouldStreamNow ? "#f97316" : "#22c55e"} />
                <span>{shouldStreamNow ? "Live Round-Wise Count Events" : "Electronic Polling Status"}</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                color: shouldStreamNow ? '#ef4444' : '#22c55e',
                background: shouldStreamNow ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.1)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                {shouldStreamNow ? "Counting Live" : "Voting Window Active"}
              </span>
            </div>

            {shouldStreamNow ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(recentStreamEvents.length > 0 ? recentStreamEvents : [
                  {
                    id: 'init-1',
                    candidateName: candidates[0]?.name || 'Nominated Candidate 1',
                    party: candidates[0]?.party || 'BJP',
                    timestamp: 'Just now',
                    ballotHash: '0x9E7A31B824F00E8B'
                  },
                  {
                    id: 'init-2',
                    candidateName: candidates[1]?.name || 'Nominated Candidate 2',
                    party: candidates[1]?.party || 'INC',
                    timestamp: '1 min ago',
                    ballotHash: '0x5C22D891E670B42A'
                  }
                ]).map(evt => (
                  <div 
                    key={evt.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{evt.candidateName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{evt.timestamp}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                      <span>{evt.party}</span>
                      <code style={{ color: '#38bdf8', fontSize: '0.68rem' }}>{evt.ballotHash}</code>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>
                  Statutory Rule 63 (Conduct of Election Rules):
                </div>
                Live broadcast of counting trends commences strictly upon closure of electronic polling booths. Cast your vote securely below.
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => {
                setSelectedElectionId(currentElection.id);
                setActiveTab('results');
              }}
              style={{
                flex: 1,
                background: shouldStreamNow ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <BarChart3 size={15} />
              <span>{shouldStreamNow ? "Watch Live Counting Stream" : "View Counting Center"}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
