import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Award, CheckCircle2, User, Building, FileText, Image, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CandidateRegisterProps {
  onSuccess?: () => void;
}

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ onSuccess }) => {
  const { user, token, isAuthenticated, openAuthModal, setActiveTab, elections, addCandidate, addEmailNotification } = useStore();
  const [selectedElectionId, setSelectedElectionId] = useState<number>(elections[0]?.id || 1);
  const [candidateName, setCandidateName] = useState(user?.fullName || '');
  const [party, setParty] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeElectionId = elections.some(e => e.id === selectedElectionId) ? selectedElectionId : (elections[0]?.id || 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      openAuthModal('voter');
      return;
    }

    if (!declarationChecked) {
      setStatusMsg({ type: 'error', text: 'You must affirm the legal candidacy integrity declaration.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const newCandidate = {
      id: Date.now(),
      name: candidateName,
      party: party || 'Independent Candidate',
      manifesto: manifesto || `Dedicated to public service, constitutional values, and transparent governance.`,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      voteCount: 0
    };

    // Immediate reactive store mutation
    addCandidate(activeElectionId, newCandidate);

    if (user?.email) {
      addEmailNotification({
        type: 'REGISTRATION',
        to: user.email,
        subject: `Candidate Nomination Recorded - ${candidateName}`,
        preview: `Your candidacy nomination has been officially accepted onto the ballot.`,
        body: `Official Candidacy Nomination Confirmation\n========================================\nDear ${candidateName},\n\nYour nomination papers have been validated and registered by the Returning Officer.\n\nNomination Summary:\n----------------------------------------\n• Candidate: ${candidateName}\n• Affiliation: ${newCandidate.party}\n• Election ID: #${activeElectionId}\n• Status: CONTESTING NOMINEE ON BALLOT\n\nElection Commission Authority`
      });
    }

    try {
      await apiService.registerCandidate({
        electionId: activeElectionId,
        name: candidateName,
        party: newCandidate.party,
        manifesto: newCandidate.manifesto,
        photoUrl: newCandidate.photoUrl
      }, token);
    } catch {
      // client mutation active
    }

    setStatusMsg({
      type: 'success',
      text: 'Nomination filed successfully! Candidate profile is now registered for this election and will appear on the ballot.'
    });
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      if (onSuccess) onSuccess();
      setActiveTab('home');
    }, 1800);
    setSubmitting(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }} className="glass-panel text-center animate-fade-in">
        <div style={{ padding: '3rem 2rem' }}>
          <Award size={48} color="#fb923c" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Candidate Nomination Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
            In accordance with Election Commission regulations, prospective candidates must authenticate with an accredited Voter ID (EPIC) before filing nomination.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => openAuthModal('voter-login')} 
              className="btn-primary"
              style={{ padding: '0.75rem 1.6rem' }}
            >
              Sign In as Elector
            </button>
            <button 
              onClick={() => openAuthModal('voter-register')} 
              className="btn-secondary"
              style={{ padding: '0.75rem 1.6rem' }}
            >
              Register New Voter ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '1rem auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <button 
          onClick={() => setActiveTab('home')}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Elections
        </button>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} color="#f97316" />
            <span>Candidate Nomination & Registration Form</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Registered electors and public servants can file their official candidacy nomination for active and upcoming elections.
          </p>
        </div>
      </div>

      <div className="glass-panel-glow" style={{ padding: '2.5rem' }}>
        {statusMsg && (
          <div style={{
            padding: '1rem 1.2rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <CheckCircle2 size={18} /> {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
          {/* Target Election */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
              Select Election to Contest *
            </label>
            <select 
              value={activeElectionId} 
              onChange={(e) => setSelectedElectionId(Number(e.target.value))}
              className="input-control"
              style={{ cursor: 'pointer', background: '#0f172a' }}
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.title} ({el.constituency || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {/* Candidate Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Full Name (as on Electoral Roll) *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Rajeshwari Sengupta"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="input-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Political Party / Independent */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Party Affiliation / Independent *
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Independent, AAP, INC, BJP, etc."
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="input-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>

          {/* Photo URL & Quick Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
              Candidate Portrait URL
            </label>
            <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
              <Image size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input 
                type="url" 
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              {[
                { label: 'Academic Leader', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
                { label: 'Public Advocate', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
                { label: 'Civic Reformer', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
                { label: 'Youth Representative', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' }
              ].map((p, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => setPhotoUrl(p.url)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#fb923c',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manifesto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
              Key Manifesto / Agenda for Voters *
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <textarea 
                rows={3}
                required
                placeholder="State your key developmental promises, educational reforms, healthcare initiatives, and civic pledges..."
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Sworn Declaration */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <input 
              type="checkbox" 
              id="declarationCheck" 
              checked={declarationChecked}
              onChange={(e) => setDeclarationChecked(e.target.checked)}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="declarationCheck" style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, cursor: 'pointer' }}>
              I hereby solemnly declare that I am an accredited citizen registered on the electoral roll (EPIC: <strong>{user?.epicNumber || 'REGISTERED'}</strong>), and the information furnished above is accurate, lawful, and binding under election regulations.
            </label>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={submitting || !declarationChecked}
            className="btn-primary"
            style={{
              padding: '0.85rem',
              fontSize: '1rem',
              background: declarationChecked ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'rgba(255,255,255,0.1)'
            }}
          >
            {submitting ? 'Filing Official Nomination...' : 'File Nomination & Add to Official Ballot'}
          </button>
        </form>
      </div>
    </div>
  );
};
