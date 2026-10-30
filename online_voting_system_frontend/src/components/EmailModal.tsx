import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Mail, X, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import type { EmailNotification } from '../types';

export const EmailModal: React.FC = () => {
  const { emailModalOpen, closeEmailModal, emailNotifications } = useStore();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'REGISTRATION' | 'VOTE_CAST' | 'RESULTS'>('ALL');

  if (!emailModalOpen) return null;

  const filteredEmails = emailNotifications.filter(e => {
    if (filter === 'ALL') return true;
    return e.type === filter;
  });

  const activeEmail: EmailNotification | undefined = selectedEmailId 
    ? emailNotifications.find(e => e.id === selectedEmailId) 
    : (filteredEmails[0] || emailNotifications[0]);

  const getTypeBadge = (type: EmailNotification['type']) => {
    switch (type) {
      case 'REGISTRATION':
        return (
          <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            REGISTRATION
          </span>
        );
      case 'VOTE_CAST':
        return (
          <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            BALLOT RECEIPT
          </span>
        );
      case 'RESULTS':
        return (
          <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            ELECTION RESULTS
          </span>
        );
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1.5rem'
    }}>
      <div 
        className="glass-panel-glow animate-fade-in" 
        style={{
          maxWidth: '920px',
          width: '100%',
          height: '85vh',
          maxHeight: '750px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: '#090d16'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.2rem 1.8rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
            }}>
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Elector Email Notification Center</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official dispatched emails for Voter Registration, Ballot Receipts & Certified Results
              </div>
            </div>
          </div>

          <button 
            onClick={closeEmailModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{
          padding: '0.8rem 1.8rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'ALL', label: `All Emails (${emailNotifications.length})` },
            { key: 'REGISTRATION', label: `Registration (${emailNotifications.filter(e => e.type === 'REGISTRATION').length})` },
            { key: 'VOTE_CAST', label: `Ballot Receipts (${emailNotifications.filter(e => e.type === 'VOTE_CAST').length})` },
            { key: 'RESULTS', label: `Certified Results (${emailNotifications.filter(e => e.type === 'RESULTS').length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              style={{
                background: filter === tab.key ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: filter === tab.key ? '#38bdf8' : 'var(--text-muted)',
                border: filter === tab.key ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area: Left list & Right detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Email List Sidebar */}
          <div style={{
            borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            {filteredEmails.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications found in this category.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = (activeEmail && activeEmail.id === email.id);
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    style={{
                      padding: '1rem 1.2rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      {getTypeBadge(email.type)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.subject}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      To: {email.to}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.preview}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Preview Detail */}
          <div style={{ overflowY: 'auto', padding: '1.8rem', background: '#0a0e17' }}>
            {activeEmail ? (
              <div>
                {/* Meta details */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                      {activeEmail.subject}
                    </h3>
                    {getTypeBadge(activeEmail.type)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>From: </span>
                      <strong style={{ color: '#f8fafc' }}>Election Commission &lt;noreply@election-system.org&gt;</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>To: </span>
                      <strong style={{ color: '#38bdf8' }}>{activeEmail.to}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
                      <span style={{ color: '#f8fafc' }}>{new Date(activeEmail.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4ade80' }}>
                      <ShieldCheck size={14} />
                      <span style={{ fontWeight: 600 }}>PGP Signed & Audited</span>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div style={{
                  background: '#060910',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.86rem',
                  lineHeight: '1.7',
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap'
                }}>
                  {activeEmail.body}
                </div>

                {/* Footer disclaimer */}
                <div style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>This is an automated cryptographic communication from the National Electronic Voting Infrastructure.</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select an email to view full details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
