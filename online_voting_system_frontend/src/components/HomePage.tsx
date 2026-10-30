import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ElectionCard } from './ElectionCard';
import { HomeLiveVoteStream } from './HomeLiveVoteStream';
import type { Election, ElectionStatus } from '../types';
import { getElectionStatus } from '../types';
import { 
  Radio, Calendar, Search, 
  Sparkles, ShieldCheck, CheckCircle2, Clock
} from 'lucide-react';

interface HomePageProps {
  elections?: Election[];
}

export const HomePage: React.FC<HomePageProps> = ({ elections: propElections }) => {
  const { elections: storeElections, selectedStatusFilter, setSelectedStatusFilter, setActiveTab, setSelectedElectionId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const elections = propElections || storeElections;

  // Classify elections
  const ongoingElections = elections.filter(e => getElectionStatus(e) === 'ONGOING');
  const upcomingElections = elections.filter(e => getElectionStatus(e) === 'UPCOMING');
  const completedElections = elections.filter(e => getElectionStatus(e) === 'COMPLETED');

  // Filter based on selected tab and search query
  const filteredElections = elections.filter(election => {
    const status = getElectionStatus(election);
    const matchesFilter = selectedStatusFilter === 'ALL' || status === selectedStatusFilter;
    const matchesSearch = 
      election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (election.constituency && election.constituency.toLowerCase().includes(searchQuery.toLowerCase())) ||
      election.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Hero Strip: Direct & Focused on Democratic Elections */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(10, 13, 20, 0.8) 50%, rgba(16, 185, 129, 0.08) 100%)',
        border: '1px solid var(--border-glow)',
        borderRadius: '20px',
        padding: '2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '850px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '0.3rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#fb923c',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} /> National E-Voting & Verification Portal
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.8rem' }}>
            Elections Portal & Live Digital Results
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Explore ongoing, upcoming, and completed democratic elections. Review dates, candidates, and live streaming tallies available to all citizens without requiring login.
          </p>

          {/* Quick Shortcuts */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                if (ongoingElections.length > 0) {
                  setSelectedElectionId(ongoingElections[0].id);
                }
                setActiveTab('results');
              }}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.4rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Radio size={16} className="pulse-indicator" />
              <span>Watch Live Stream Broadcast (Open to All)</span>
            </button>

            <button 
              onClick={() => setActiveTab('verify')}
              className="btn-secondary"
              style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem' }}
            >
              <ShieldCheck size={16} />
              <span>Verify Digital Ballot Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Vote Stream on Home Page */}
      <HomeLiveVoteStream elections={elections} />

      {/* FILTER TABS: UPCOMING, ONGOING, COMPLETED */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '1.2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Elections', count: elections.length, color: '#fb923c' },
            { key: 'ONGOING', label: 'ONGOING (Live)', count: ongoingElections.length, color: '#4ade80' },
            { key: 'UPCOMING', label: 'UPCOMING', count: upcomingElections.length, color: '#38bdf8' },
            { key: 'COMPLETED', label: 'COMPLETED', count: completedElections.length, color: '#94a3b8' }
          ].map(tab => {
            const isSelected = selectedStatusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusFilter(tab.key as 'ALL' | ElectionStatus)}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: isSelected ? `1px solid ${tab.color}` : '1px solid transparent',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                {tab.key === 'ONGOING' && (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} className="pulse-indicator"></span>
                )}
                {tab.key === 'UPCOMING' && <Clock size={14} color="#38bdf8" />}
                {tab.key === 'COMPLETED' && <CheckCircle2 size={14} color="#94a3b8" />}
                <span>{tab.label}</span>
                <span style={{
                  background: isSelected ? tab.color : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#000000' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search elections, state, or constituency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{ paddingLeft: '2.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem 0.5rem 2.4rem' }}
          />
        </div>
      </div>

      {/* Elections List */}
      <div>
        {filteredElections.length > 0 ? (
          filteredElections.map(election => (
            <ElectionCard key={election.id} election={election} />
          ))
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem', borderRadius: '16px' }}>
            <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Elections Found in this Category</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              No elections currently match status "{selectedStatusFilter}" or search query "{searchQuery}".
            </p>
            <button 
              onClick={() => { setSelectedStatusFilter('ALL'); setSearchQuery(''); }}
              className="btn-secondary"
              style={{ marginTop: '1.2rem', fontSize: '0.85rem' }}
            >
              Reset Filters & View All Elections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
