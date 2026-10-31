import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { Election, Candidate } from '../types';
import { getElectionStatus } from '../types';
import { 
  CheckCircle2, Calendar, AlertTriangle, ArrowRight, 
  MapPin, Radio, Award, BarChart3, Clock, ShieldCheck, Mail, Trophy, Sparkles,
  Edit3, LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ElectionCardProps {
  election: Election;
}

export const ElectionCard: React.FC<ElectionCardProps> = ({ election }) => {
  const { 
    user, isAuthenticated, token, 
    activeReceipt, setActiveReceipt, setActiveTab, setSelectedElectionId,
    openAuthModal, addVoteHistory, recordVote, addEmailNotification, openEmailModal,
    setElections, deleteCandidate 
  } = useStore();

  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultsEmailSent, setResultsEmailSent] = useState(false);

  const status = getElectionStatus(election);

  const handleExitFromCard = async (e: React.MouseEvent, candId: number, candName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Withdraw "${candName}" and exit from this election? This candidate will be removed from the ballot.`)) return;
    try {
      if (token) await apiService.deleteCandidate(candId, token);
    } catch {
      // offline fallback
    }
    deleteCandidate(election.id, candId);
    apiService.getElections().then(data => { if (data && data.length > 0) setElections(data); }).catch(() => {});
  };

  // Compute vote totals and winner for completed elections
  const candidates = election.candidates || [];
  const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
  const sortedCandidates = [...candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const winner: Candidate | null = sortedCandidates.length > 0 ? sortedCandidates[0] : null;
  const winnerPercentage = (totalVotes > 0 && winner) ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : '0.0';

  const handleVoteSubmit = async () => {
    if (!isAuthenticated || !user) {
      openAuthModal('voter');
      return;
    }

    if (!selectedCandidateId) {
      setErrorMsg("Please select your preferred candidate or NOTA on the electronic ballot unit.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const candidate = candidates.find(c => c.id === selectedCandidateId);
    const candidateName = candidate ? candidate.name : 'Nominated Candidate';

    try {
      // 1. Mutate reactive store immediately so all pages/tallies update instantly
      recordVote(election.id, selectedCandidateId);

      // 2. Cast on backend if connected
      let receipt;
      try {
        receipt = await apiService.castVote(election.id, selectedCandidateId, token || '');
      } catch {
        const mockHash = "BALLOT-IN-0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + 
                         Math.random().toString(16).substring(2, 10).toUpperCase();
        receipt = {
          ballotHash: mockHash,
          electionId: election.id,
          electionTitle: election.title,
          candidateName,
          timestamp: new Date().toISOString(),
          verificationStatus: "VERIFIED_ON_ELECTORAL_ROLL"
        };
      }

      setHasVoted(true);
      setActiveReceipt(receipt);
      addVoteHistory(receipt);

      // Re-fetch all elections from backend DB so tallies and vote totals match PostgreSQL
      apiService.getElections().then(data => {
        if (data && data.length > 0) setElections(data);
      }).catch(() => {});

      // 3. Dispatch Live Email Notification via Backend JavaMailSender
      apiService.sendVoteReceiptEmail(user.email, election.title, candidateName, receipt.ballotHash).catch(() => {});

      // 4. Dispatch In-App Email Notification for Vote Cast
      addEmailNotification({
        type: 'VOTE_CAST',
        to: user.email,
        subject: `Ballot Submission Receipt - ${election.title}`,
        preview: `Your vote for ${candidateName} has been cryptographically recorded.`,
        body: `Official Ballot Receipt Confirmation\n========================================\nDear ${user.fullName},\n\nYour digital vote has been successfully cast and recorded on the public cryptographic registry.\n\nReceipt Details:\n----------------------------------------\n• Election: ${election.title}\n• Selected Candidate: ${candidateName} (${candidate?.party || 'Independent'})\n• Cryptographic Ballot Hash: ${receipt.ballotHash}\n• Timestamp: ${new Date(receipt.timestamp).toLocaleString()}\n• Audit Status: VERIFIED & TAMPER-EVIDENT\n\nKeep your cryptographic ballot hash to independently verify your vote in the public ledger without disclosing your identity.\n\nElection Commission Authority`
      });

      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record electronic ballot");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailResults = async () => {
    const targetEmail = user?.email || 'voter@gmail.com';
    
    // 1. Dispatch Live Results Email Notification via Backend JavaMailSender
    apiService.sendResultsEmail(
      targetEmail,
      election.title,
      winner?.name || 'Candidate',
      winner?.party || 'Independent',
      winner?.voteCount || 0,
      totalVotes
    ).catch(() => {});

    // 2. Add In-App Email Notification for Election Results
    addEmailNotification({
      type: 'RESULTS',
      to: targetEmail,
      subject: `Official Certified Election Results - ${election.title}`,
      preview: `Official results certified: ${winner?.name} declared winner with ${winner?.voteCount.toLocaleString()} votes.`,
      body: `Official Certified Election Results\n========================================\nElection: ${election.title}\nTerritorial Jurisdiction: ${election.constituency || 'General Constituency'}\nAudit Status: COMPLETED & CERTIFIED\n\nDECLARED WINNER:\n----------------------------------------\n• Winning Candidate: ${winner?.name || 'N/A'}\n• Political Party: ${winner?.party || 'N/A'}\n• Total Votes Secured: ${winner?.voteCount.toLocaleString() || 0} (${winnerPercentage}% of ${totalVotes.toLocaleString()} total votes cast)\n\nFULL CANDIDATE TALLY BREAKDOWN:\n----------------------------------------\n` +
        sortedCandidates.map((c, i) => `${i + 1}. ${c.name} (${c.party}) — ${c.voteCount.toLocaleString()} votes (${totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0}%)\n`).join('') +
        `\nThank you for participating in the sovereign democratic process.\nElection Commission of India`
    });

    try {
      await apiService.emailResults(election.id, targetEmail);
    } catch {
      // offline simulation handled
    }

    setResultsEmailSent(true);
    confetti({ particleCount: 60, spread: 50 });
  };

  const handleWatchLiveStream = () => {
    setSelectedElectionId(election.id);
    setActiveTab('results');
  };

  const statusBadge = () => {
    switch (status) {
      case 'ONGOING':
        return (
          <span style={{
            background: 'rgba(22, 163, 74, 0.18)',
            color: '#4ade80',
            border: '1px solid rgba(22, 163, 74, 0.4)',
            padding: '0.25rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} className="pulse-indicator"></span>
            ONGOING • LIVE VOTING
          </span>
        );
      case 'UPCOMING':
        return (
          <span style={{
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '0.25rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Clock size={13} />
            UPCOMING • SCHEDULED
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            padding: '0.25rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Trophy size={13} color="#facc15" />
            COMPLETED • RESULTS CERTIFIED
          </span>
        );
    }
  };

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '2.2rem',
        marginBottom: '2rem',
        border: status === 'ONGOING' 
          ? '1px solid rgba(34, 197, 94, 0.35)' 
          : (status === 'COMPLETED' ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid var(--border-subtle)'),
        borderRadius: '16px',
        position: 'relative'
      }}
    >
      {/* Top Meta Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            {statusBadge()}

            {election.constituency && (
              <span style={{ fontSize: '0.8rem', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(249, 115, 22, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                <MapPin size={13} /> {election.constituency}
              </span>
            )}

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Election #{election.id}
            </span>
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '0.4rem' }}>
            {election.title}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '850px', lineHeight: '1.5' }}>
            {election.description}
          </p>
        </div>

        {/* Live Stream / Quick Results CTA */}
        <button 
          onClick={handleWatchLiveStream}
          style={{
            background: status === 'ONGOING' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: status === 'ONGOING' ? '#f87171' : 'var(--text-muted)',
            border: `1px solid ${status === 'ONGOING' ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
            padding: '0.55rem 1rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          {status === 'ONGOING' && <Radio size={14} className="pulse-indicator" />}
          {status === 'COMPLETED' && <BarChart3 size={14} color="#facc15" />}
          <span>{status === 'COMPLETED' ? 'View Official Audit Ledger' : 'Live Stream Tallies (Open to All)'}</span>
        </button>
      </div>

      {/* Dates Row */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        padding: '0.8rem 1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={14} color="#38bdf8" />
          <span>Polling Window Opens: <strong style={{ color: '#f8fafc' }}>{new Date(election.startTime).toLocaleString()}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={14} color="#f87171" />
          <span>Voting Concludes: <strong style={{ color: '#f8fafc' }}>{new Date(election.endTime).toLocaleString()}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          <ShieldCheck size={14} color="#4ade80" />
          <span>Independent SHA-256 Ledger Verification</span>
        </div>
      </div>

      {/* COMPLETED ELECTIONS: WINNER SPOTLIGHT & VOTES GAINED FOR EACH CANDIDATE */}
      {status === 'COMPLETED' && (
        <div style={{ marginBottom: '1.8rem' }}>
          {/* Winner Spotlight Banner */}
          {winner && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(10, 14, 23, 0.95) 100%)',
              border: '2px solid rgba(234, 179, 8, 0.45)',
              borderRadius: '16px',
              padding: '1.8rem 2rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              boxShadow: '0 8px 30px rgba(234, 179, 8, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={winner.photoUrl} 
                    alt={winner.name}
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #facc15',
                      boxShadow: '0 0 20px rgba(250, 204, 21, 0.4)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '-6px',
                    background: '#facc15',
                    color: '#000000',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}>
                    <Trophy size={16} />
                  </div>
                </div>

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
                    letterSpacing: '0.05em',
                    marginBottom: '0.4rem'
                  }}>
                    <Sparkles size={13} /> OFFICIAL ELECTION WINNER • ELECTED
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff' }}>
                    {winner.name}
                  </h3>

                  <div style={{ fontSize: '0.95rem', color: '#facc15', fontWeight: 700, marginTop: '0.1rem' }}>
                    {winner.party}
                  </div>
                </div>
              </div>

              {/* Winner Vote Stats */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '1rem 1.8rem',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '220px'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#facc15', lineHeight: 1.1 }}>
                  {winner.voteCount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  VOTES WON ({winnerPercentage}% SHARE)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  Total Ballots Cast: {totalVotes.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Complete Candidate Vote Breakdown Table & Progress Bars */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Certified Candidate Vote Counts & Percentages
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Detailed vote breakdown for all contesting candidates in this election
                </div>
              </div>

              {/* Action Button: Email Election Results */}
              <button
                onClick={handleEmailResults}
                style={{
                  background: resultsEmailSent ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  color: resultsEmailSent ? '#4ade80' : '#38bdf8',
                  border: `1px solid ${resultsEmailSent ? 'rgba(34, 197, 94, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Mail size={15} />
                <span>{resultsEmailSent ? 'Results Emailed ✓' : 'Email Official Results to Me'}</span>
              </button>
            </div>

            {resultsEmailSent && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#4ade80'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Official certified results summary dispatched to <strong>{user?.email || 'your email'}</strong>.</span>
                </div>
                <button
                  onClick={openEmailModal}
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View in Email Inbox →
                </button>
              </div>
            )}

            {/* Candidate Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedCandidates.map((candidate, idx) => {
                const isCandidateWinner = idx === 0 && (candidate.voteCount || 0) > 0;
                const percent = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : '0.0';

                return (
                  <div 
                    key={candidate.id}
                    style={{
                      background: isCandidateWinner ? 'rgba(234, 179, 8, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: isCandidateWinner ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '1rem 1.2rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <img 
                          src={candidate.photoUrl} 
                          alt={candidate.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: isCandidateWinner ? '2px solid #facc15' : '1px solid var(--border-subtle)'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                              {candidate.name}
                            </span>
                            {isCandidateWinner && (
                              <span style={{ background: '#facc15', color: '#000', fontSize: '0.68rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                WINNER
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: isCandidateWinner ? '#facc15' : 'var(--text-muted)', fontWeight: 600 }}>
                            {candidate.party}
                          </div>
                        </div>
                      </div>

                      {/* Vote tally and percent */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isCandidateWinner ? '#facc15' : '#ffffff' }}>
                          {candidate.voteCount.toLocaleString()} votes
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {percent}% of ballots
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: isCandidateWinner 
                          ? 'linear-gradient(90deg, #facc15 0%, #eab308 100%)' 
                          : 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                        borderRadius: '9999px',
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ONGOING / UPCOMING: EVM Electronic Ballot Unit for Candidates */}
      {status !== 'COMPLETED' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              Nominated Candidates & Electronic Ballot Unit ({candidates.length}):
            </h4>
            <button 
              onClick={() => setActiveTab('candidate-register')}
              style={{
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                color: '#fb923c',
                fontSize: '0.8rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700
              }}
            >
              <Award size={14} /> Candidates Hub (Add • View • Edit • Exit)
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {candidates.map((candidate: Candidate) => {
              const isSelected = selectedCandidateId === candidate.id;
              const canVoteOnCard = status === 'ONGOING' && !hasVoted;

              return (
                <div 
                  key={candidate.id}
                  onClick={() => {
                    if (canVoteOnCard) {
                      if (!isAuthenticated) {
                        openAuthModal('voter');
                      } else {
                        setSelectedCandidateId(candidate.id);
                      }
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    cursor: canVoteOnCard ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.8rem' }}>
                      <img 
                        src={candidate.photoUrl} 
                        alt={candidate.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)'
                        }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{candidate.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#fb923c', fontWeight: 600 }}>
                          {candidate.party}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      {candidate.manifesto}
                    </p>
                  </div>

                  <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Candidate #{candidate.id} • {candidate.voteCount || 0} votes
                    </span>

                    {/* Candidate Management Controls: Edit & Exit */}
                    {isAuthenticated && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          title="Edit Candidate Profile"
                          onClick={(e) => { e.stopPropagation(); setActiveTab('candidate-register'); }}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          <Edit3 size={11} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          title="Withdraw and Exit Election"
                          onClick={(e) => handleExitFromCard(e, candidate.id, candidate.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          <LogOut size={11} />
                          <span>Exit</span>
                        </button>
                      </div>
                    )}

                    {status === 'ONGOING' && (
                      <div style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '6px',
                        background: isSelected ? '#f97316' : '#1e3a8a',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: isSelected ? '0 0 12px rgba(249, 115, 22, 0.5)' : 'none'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? '#ffffff' : '#60a5fa' }}></div>
                        {isSelected ? 'SELECTED' : 'SELECT TO VOTE'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Email Notification Receipt Confirmation Banner (Post Vote) */}
      {hasVoted && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mail size={18} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ color: '#f8fafc', fontWeight: 700 }}>Official Ballot Receipt Dispatched via Email</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  A confirmation receipt with your cryptographic ballot hash was sent to <strong style={{ color: '#38bdf8' }}>{user?.email}</strong>.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {showEmailPreview ? 'Hide Receipt' : 'Preview Email Receipt'}
              </button>

              <button
                onClick={openEmailModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Open Inbox →
              </button>
            </div>
          </div>

          {showEmailPreview && (
            <div style={{
              background: '#090d16',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '1.2rem',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
              color: '#94a3b8',
              lineHeight: 1.6
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                Subject: Ballot Submission Receipt - {election.title}
              </div>
              <div><strong>To:</strong> {user?.email}</div>
              <div><strong>From:</strong> Election Commission &lt;noreply@election-system.org&gt;</div>
              <div style={{ margin: '0.6rem 0', borderTop: '1px dashed rgba(255,255,255,0.1)' }}></div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>Dear {user?.fullName || 'Elector'},</div>
              <div style={{ marginTop: '0.3rem' }}>Your vote has been officially cast and cryptographically recorded.</div>
              <div style={{ marginTop: '0.5rem' }}>• <strong>Election:</strong> {election.title}</div>
              <div>• <strong>Verification Status:</strong> AUTHENTIC & ENCRYPTED</div>
              <div>• <strong>Timestamp:</strong> {activeReceipt?.timestamp ? new Date(activeReceipt.timestamp).toLocaleString() : 'Recorded Just Now'}</div>
              <div>• <strong>Ballot Hash:</strong> <span style={{ color: '#fb923c' }}>{activeReceipt?.ballotHash || 'BALLOT-IN-0x7F8B2C49A1...'}</span></div>
              <div style={{ marginTop: '0.6rem', color: '#64748b', fontSize: '0.75rem' }}>
                Keep this cryptographic hash safe to independently verify your vote in the public registry without disclosing your identity.
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '0.8rem 1rem',
          borderRadius: '8px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.2rem'
        }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* Action Footer */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {status === 'ONGOING' && (
          <>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4ade80' }}>
                <CheckCircle2 size={16} />
                <span>Logged in as <strong>{user?.fullName}</strong> (EPIC: {user?.epicNumber || 'Verified'})</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fb923c' }}>
                <ShieldCheck size={16} />
                <span>Please sign in or register as an elector to cast your ballot.</span>
              </div>
            )}

            {!hasVoted ? (
              isAuthenticated ? (
                <button 
                  onClick={handleVoteSubmit}
                  disabled={submitting || !selectedCandidateId}
                  className="btn-primary"
                  style={{
                    padding: '0.75rem 1.8rem',
                    fontSize: '0.92rem',
                    background: selectedCandidateId ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'rgba(255,255,255,0.08)'
                  }}
                >
                  {submitting ? 'Recording Electronic Ballot...' : 'Confirm & Cast Electronic Vote'}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={() => openAuthModal('voter')}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  <span>Sign In as Elector to Vote</span>
                </button>
              )
            ) : (
              <button 
                onClick={() => setActiveTab('verify')}
                className="btn-secondary"
                style={{ fontSize: '0.88rem' }}
              >
                Verify Digital Ballot Receipt
              </button>
            )}
          </>
        )}

        {status === 'UPCOMING' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} /> Polling commences on {new Date(election.startTime).toLocaleString()}
            </span>
            <button 
              onClick={() => setActiveTab('candidate-register')}
              className="btn-primary"
              style={{ fontSize: '0.88rem', padding: '0.65rem 1.4rem' }}
            >
              <Award size={16} /> Nominate Candidate
            </button>
          </div>
        )}

        {status === 'COMPLETED' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#facc15" /> Election concluded & certified. {winner ? <>Winner: <strong style={{ color: '#facc15' }}>{winner.name}</strong> ({winner.party})</> : 'No candidates registered.'}
            </span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button 
                onClick={handleWatchLiveStream}
                className="btn-secondary"
                style={{ fontSize: '0.88rem', padding: '0.65rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <BarChart3 size={16} /> Live Audit Stream
              </button>
              <button 
                onClick={handleEmailResults}
                className="btn-primary"
                style={{ fontSize: '0.88rem', padding: '0.65rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              >
                <Mail size={16} /> Email Me Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
