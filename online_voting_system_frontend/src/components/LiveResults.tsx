import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import type { ElectionResults } from '../types';
import { getElectionStatus } from '../types';
import { useStore } from '../store/useStore';
import { BarChart3, Users, Award, CheckCircle, MapPin, Radio, Zap } from 'lucide-react';

export const LiveResults: React.FC = () => {
  const { elections, selectedElectionId: storeElectionId, setSelectedElectionId: setStoreElectionId } = useStore();
  const selectedElectionId = storeElectionId || elections[0]?.id || 1;
  const [streamStatus, setStreamStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastStreamTime, setLastStreamTime] = useState<string>('Connecting...');
  const [liveResults, setLiveResults] = useState<ElectionResults | null>(null);
  const [recentlyUpdatedCandidateId, setRecentlyUpdatedCandidateId] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE Live Result Stream whenever selectedElectionId changes
  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseUrl = apiService.getStreamResultsUrl(selectedElectionId);
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
          // Detect which candidate's count increased to show micro-pulse animation
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
  }, [selectedElectionId]);

  const currentElection = elections.find(e => e.id === selectedElectionId) || elections[0];

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
    : displayCandidates.reduce((acc, c) => acc + c.voteCount, 0);

  const currentStatus = getElectionStatus(currentElection);
  const isCompleted = currentStatus === 'COMPLETED';

  return (
    <div style={{ maxWidth: '980px', margin: '2rem auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        
        {/* Header & Stream Status Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <BarChart3 size={26} color="#fb923c" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Electoral Constituency Counting Center</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Official round-wise counting trends broadcast in real-time via Server-Sent Events (SSE).
            </p>
          </div>

          {/* SSE Live Status Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: streamStatus === 'connected' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : streamStatus === 'connecting' 
                ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                streamStatus === 'connected' 
                  ? 'rgba(16, 185, 129, 0.4)' 
                  : streamStatus === 'connecting' 
                  ? 'rgba(245, 158, 11, 0.4)' 
                  : 'rgba(239, 68, 68, 0.4)'
              }`,
              color: streamStatus === 'connected' ? '#34d399' : streamStatus === 'connecting' ? '#fbbf24' : '#f87171'
            }}>
              <Radio size={14} style={{ animation: streamStatus === 'connected' ? 'pulse 1.5s infinite' : 'none' }} />
              <span>
                {streamStatus === 'connected' && 'LIVE SSE STREAM ACTIVE'}
                {streamStatus === 'connecting' && 'CONNECTING STREAM...'}
                {streamStatus === 'disconnected' && 'STREAM DISCONNECTED (OFFLINE)'}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Last sync: <strong style={{ color: '#e2e8f0' }}>{lastStreamTime}</strong>
            </span>
          </div>
        </div>

        {/* Election Selector bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#fb923c" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Ballot Constituency:</span>
          </div>
          <select 
            value={currentElection.id}
            onChange={(e) => {
              const newId = Number(e.target.value);
              setStoreElectionId(newId);
            }}
            className="input-control"
            style={{ maxWidth: '420px', cursor: 'pointer' }}
          >
            {elections.map(el => (
              <option key={el.id} value={el.id}>{el.title} {el.constituency ? `- ${el.constituency}` : ''}</option>
            ))}
          </select>
        </div>

        {/* Aggregate Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={16} /> Total EVM Ballots Polled
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: '#fb923c' }}>
              {totalVotes.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} /> Selected Constituency
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: '#38bdf8' }}>
              {currentElection.constituency || "General Parliamentary Seat"}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} /> ECI Certification
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', color: isCompleted ? '#10b981' : '#f59e0b' }}>
              {isCompleted ? 'Official Declaration Certified' : 'Live Polling Stream'}
            </div>
          </div>
        </div>

        {/* Candidate Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {displayCandidates
            .slice()
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((c, idx) => {
              const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0';
              const isWinner = idx === 0 && totalVotes > 0;
              const isPulsing = recentlyUpdatedCandidateId === c.id;

              return (
                <div key={c.id} style={{
                  background: isPulsing ? 'rgba(34, 197, 94, 0.15)' : 'rgba(15, 22, 36, 0.7)',
                  padding: '1.4rem',
                  borderRadius: '14px',
                  border: isPulsing 
                    ? '1px solid #22c55e' 
                    : isWinner 
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
                          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.name}</span>
                          {isWinner && (
                            <span style={{
                              background: 'rgba(249, 115, 22, 0.2)',
                              color: '#fb923c',
                              padding: '0.15rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <Award size={13} /> LEADING
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
                              +1 NEW VOTE RECEIVED
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
                      background: isWinner 
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
    </div>
  );
};
