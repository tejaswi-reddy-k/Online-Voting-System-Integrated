import React from 'react';
import { useStore } from '../store/useStore';
import { IdCard, MapPin, CheckCircle2, ShieldCheck, Vote, Award, ExternalLink, Calendar, LogOut, Mail } from 'lucide-react';

export const VoterProfile: React.FC = () => {
  const { user, voteHistory, logout, setActiveTab, setSelectedStatusFilter, openEmailModal, emailNotifications } = useStore();

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No authenticated elector profile found.</p>
        <button 
          onClick={() => setActiveTab('home')} 
          className="btn-primary" 
          style={{ marginTop: '1rem' }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '1rem auto' }} className="animate-fade-in">
      {/* Official ECI Digital Voter Card */}
      <div 
        className="glass-panel" 
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(10, 13, 20, 0.95) 50%, rgba(22, 163, 74, 0.1) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '20px',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          marginBottom: '2rem'
        }}
      >
        {/* Top Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.2rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f97316 0%, #ffffff 50%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}>
              <div style={{ width: '100%', height: '100%', background: '#0a0d14', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#38bdf8', fontSize: '0.85rem' }}>
                ECI
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', color: '#fb923c', fontWeight: 700 }}>
                ELECTION COMMISSION OF INDIA
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                DIGITAL ELECTOR PHOTO IDENTITY CARD (e-EPIC)
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(22, 163, 74, 0.2)',
            color: '#4ade80',
            border: '1px solid rgba(22, 163, 74, 0.4)',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <CheckCircle2 size={15} /> VERIFIED ELECTOR
          </div>
        </div>

        {/* Card Body */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar Photo */}
          <div style={{
            width: '100px',
            height: '110px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f97316 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '2.5rem',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {user.fullName.charAt(0)}
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elector Full Name</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>{user.fullName}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <IdCard size={13} color="#f97316" /> EPIC Number (Voter ID)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fb923c', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                {user.epicNumber || 'IND-EPIC-77402'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} color="#38bdf8" /> Constituency
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                {user.constituency || 'Varanasi (UP-77)'}
              </div>
            </div>

            {user.dob && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} color="#4ade80" /> Date of Birth
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {user.dob}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Email</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>{user.email}</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} color="#38bdf8" />
              <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
                <strong>Email Receipts:</strong> Dispatched automatically to <strong>{user.email}</strong> on every registration, ballot cast, and results declaration.
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls for Voter */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              setSelectedStatusFilter('ONGOING');
              setActiveTab('home');
            }} 
            className="btn-primary"
            style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem' }}
          >
            <Vote size={18} />
            <span>Select Active Elections to Cast Vote</span>
          </button>

          <button 
            onClick={() => setActiveTab('candidate-register')}
            className="btn-secondary"
            style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem', border: '1px solid rgba(249, 115, 22, 0.4)', color: '#fb923c' }}
          >
            <Award size={18} />
            <span>Register as Candidate for an Election</span>
          </button>

          <button 
            onClick={openEmailModal}
            className="btn-secondary"
            style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Mail size={16} />
            <span>Email Notifications ({emailNotifications.length})</span>
          </button>

          <button 
            onClick={logout}
            className="btn-secondary"
            style={{ marginLeft: 'auto', fontSize: '0.9rem', padding: '0.65rem 1.2rem' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Voting History & Cryptographic Receipts */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#10b981" />
              <span>Ballots Cast & Cryptographic Audit Receipts</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Every vote cast generates a verifiable SHA-256 cryptographic receipt ensuring zero-knowledge voter privacy and mathematical auditability.
            </p>
          </div>
        </div>

        {voteHistory && voteHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {voteHistory.map((receipt, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.3rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                    {receipt.electionTitle}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#fb923c', marginTop: '0.2rem' }}>
                    Candidate Voted: <strong>{receipt.candidateName}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={13} /> Recorded: {new Date(receipt.timestamp).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '0.3rem', wordBreak: 'break-all' }}>
                    Ballot Hash: {receipt.ballotHash}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActiveTab('verify');
                  }}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Verify in Public Registry</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
            <Vote size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.8rem', opacity: 0.6 }} />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>No Ballots Cast Yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem', maxWidth: '400px', margin: '0.3rem auto 1.2rem' }}>
              Your electronic ballots will be listed here with cryptographic verification receipts once cast.
            </p>
            <button 
              onClick={() => {
                setSelectedStatusFilter('ONGOING');
                setActiveTab('home');
              }}
              className="btn-primary"
              style={{ fontSize: '0.88rem', padding: '0.55rem 1.2rem' }}
            >
              Browse Active Elections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
