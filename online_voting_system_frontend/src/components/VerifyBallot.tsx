import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { VoteReceipt } from '../types';
import { Search, ShieldCheck, Copy, FileBadge, Calendar, Hash } from 'lucide-react';

export const VerifyBallot: React.FC = () => {
  const { activeReceipt } = useStore();
  const [hashInput, setHashInput] = useState(activeReceipt?.ballotHash || '');
  const [result, setResult] = useState<VoteReceipt | null>(activeReceipt);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.verifyBallot(hashInput.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Ballot hash not found in public ledger');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Public Cryptographic Ballot Verification</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '580px', margin: '0.4rem auto 0' }}>
            Verify that your individual vote was securely hashed, permanently logged to the audit ledger, and counted without compromising voter privacy.
          </p>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Hash size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Paste SHA-256 Ballot Hash (e.g. 0x8F9A4E31C052441A9908F4588E236D09)"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '2.6rem' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
            style={{ padding: '0.75rem 1.6rem' }}
          >
            <Search size={18} />
            <span>{loading ? 'Verifying on Ledger...' : 'Audit Ballot'}</span>
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="glass-panel-glow animate-fade-in" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <FileBadge size={28} color="#10b981" />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cryptographic Audit Certificate</h3>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Status: {result.verificationStatus}</div>
              </div>
            </div>
            <button 
              onClick={() => copyToClipboard(result.ballotHash)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <Copy size={14} />
              <span>{copied ? 'Copied!' : 'Copy Hash'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Election Reference</div>
              <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{result.electionTitle}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selected Candidate</div>
              <div style={{ fontWeight: 600, color: '#818cf8', marginTop: '0.2rem' }}>{result.candidateName}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cryptographic Timestamp</div>
              <div style={{ fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 22, 36, 0.9)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              SHA-256 Tamper-Proof Cryptographic Hash:
            </div>
            <div className="hash-pill" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {result.ballotHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
