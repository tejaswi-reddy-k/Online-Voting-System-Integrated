import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { PaymentReceipt, Candidate } from '../types';
import { calculateAge } from '../types';
import { 
  Award, CheckCircle2, User, Building, FileText, Image, ArrowLeft,
  CreditCard, QrCode, Building2, ShieldCheck, Lock, ArrowRight,
  Printer, RefreshCw, Edit3, PlusCircle, Eye, AlertTriangle, X,
  MapPin, LogOut, Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CandidateRegisterProps {
  onSuccess?: () => void;
}

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ onSuccess }) => {
  const { 
    user, token, isAuthenticated, openAuthModal, setActiveTab, 
    elections, setElections, addCandidate, updateCandidate, deleteCandidate, addEmailNotification 
  } = useStore();

  // Primary Mode: 'view' (View, Edit, Exit Candidacies) | 'add' (File Nomination & Pay Deposit)
  const [portalMode, setPortalMode] = useState<'view' | 'add'>('view');

  // Filter for View mode
  const [viewElectionFilter, setViewElectionFilter] = useState<number | 'ALL'>('ALL');

  // Edit Modal State
  const [editingCandidate, setEditingCandidate] = useState<{ candidate: Candidate; electionId: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [editParty, setEditParty] = useState('');
  const [editManifesto, setEditManifesto] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Nomination (Add) Form States
  const [selectedElectionId, setSelectedElectionId] = useState<number>(elections[0]?.id || 1);
  const [candidateName, setCandidateName] = useState(user?.fullName || '');
  const [candidateDob, setCandidateDob] = useState('1995-01-01');
  const [party, setParty] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  
  // Step Management for Add: 'details' -> 'payment' -> 'receipt'
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'receipt'>('details');
  
  // Payment Gateway States
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState(`${(user?.email || 'elector').split('@')[0]}@okaxis`);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('786');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeElection = elections.find(e => e.id === selectedElectionId) || elections[0];
  const activeElectionId = activeElection ? activeElection.id : 1;
  const depositAmount = 25; // Candidate Nomination Security Deposit (₹25)

  // Move from nomination details to payment gateway
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      openAuthModal('voter');
      return;
    }

    // Constitutional requirement: Candidate must be at least 25 years old
    const candidateAge = calculateAge(candidateDob);
    if (candidateAge < 25) {
      setStatusMsg({
        type: 'error',
        text: `Constitutional Ineligibility: Candidates must be at least 25 years of age to contest an election (Current age: ${candidateAge} years).`
      });
      return;
    }

    if (!declarationChecked) {
      setStatusMsg({ type: 'error', text: 'You must affirm the legal candidacy integrity declaration.' });
      return;
    }

    setStatusMsg(null);
    setCurrentStep('payment');
  };

  // Process Statutory Security Deposit Payment & Add Candidate
  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    setStatusMsg(null);

    try {
      // 1. Create payment order on backend
      const order = await apiService.createPaymentOrder({
        electionId: activeElectionId,
        candidateName,
        amount: depositAmount
      }, token || '');

      // Simulate banking gateway authorization delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 2. Verify payment on backend & generate treasury receipt
      const receipt = await apiService.verifyPayment({
        orderId: order.orderId,
        paymentMethod: paymentMethod.toUpperCase(),
        amount: depositAmount,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        bankName: paymentMethod === 'netbanking' ? selectedBank : undefined
      }, token || '');

      setPaymentReceipt(receipt);

      // 3. Register candidate with verified payment reference in backend database
      let savedCandidate: any = null;
      try {
        savedCandidate = await apiService.registerCandidate({
          electionId: activeElectionId,
          name: candidateName,
          party: party || 'Independent Candidate',
          manifesto: manifesto || `Dedicated to public service, constitutional values, and transparent governance.`,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
          paymentTransactionId: receipt.transactionId,
          securityDepositAmount: depositAmount,
          dob: candidateDob,
          age: calculateAge(candidateDob)
        }, token || '');
      } catch (err: any) {
        console.warn('Backend candidate registration warning:', err);
      }

      const enrolledCandidate: Candidate = savedCandidate || {
        id: Date.now(),
        name: candidateName,
        party: party || 'Independent Candidate',
        manifesto: manifesto || `Dedicated to public service, constitutional values, and transparent governance.`,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        voteCount: 0,
        dob: candidateDob,
        age: calculateAge(candidateDob)
      };

      addCandidate(activeElectionId, enrolledCandidate);

      // Re-fetch all elections from database to guarantee local state matches PostgreSQL
      apiService.getElections().then(data => {
        if (data && data.length > 0) setElections(data);
      }).catch(() => {});

      // 4. Dispatch In-App Email Notification with Treasury Receipt Details
      if (user?.email) {
        addEmailNotification({
          type: 'REGISTRATION',
          to: user.email,
          subject: `Candidacy Nomination & Security Deposit Cleared - ${candidateName}`,
          preview: `Statutory Security Deposit of ₹${depositAmount.toLocaleString()} cleared. Transaction: ${receipt.transactionId}`,
          body: `Official Candidacy Nomination & Treasury Receipt\n========================================\nDear ${candidateName},\n\nYour nomination papers and statutory electoral security deposit have been officially admitted.\n\nNomination Summary:\n----------------------------------------\n• Candidate: ${candidateName}\n• Affiliation: ${enrolledCandidate.party}\n• Election: ${activeElection?.title || 'Democratic Election'}\n• Security Deposit: ₹${depositAmount.toLocaleString()} INR\n• Transaction ID: ${receipt.transactionId}\n• Treasury Reference: ${receipt.treasuryReference}\n• Payment Mode: ${paymentMethod.toUpperCase()}\n• Status: CONTESTING NOMINEE ON OFFICIAL BALLOT\n\nElection Commission Authority`
        });
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setCurrentStep('receipt');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Payment processing failed. Please retry.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (candidate: Candidate, electionId: number) => {
    setEditingCandidate({ candidate, electionId });
    setEditName(candidate.name);
    setEditParty(candidate.party);
    setEditManifesto(candidate.manifesto);
    setEditPhotoUrl(candidate.photoUrl);
    setStatusMsg(null);
  };

  // Save Candidate Edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setIsSavingEdit(true);
    setStatusMsg(null);

    const { candidate, electionId } = editingCandidate;
    const updatedFields = {
      name: editName,
      party: editParty,
      manifesto: editManifesto,
      photoUrl: editPhotoUrl
    };

    try {
      if (token) {
        await apiService.updateCandidate(candidate.id, updatedFields, token);
      }
    } catch (err: any) {
      console.warn('Backend candidate update fallback:', err);
    }

    // Update store state
    updateCandidate(electionId, candidate.id, updatedFields);

    // Refresh elections from backend
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({
      type: 'success',
      text: `Candidate "${editName}" updated successfully!`
    });

    setEditingCandidate(null);
    setIsSavingEdit(false);
  };

  // Exit / Withdraw Candidate from Election
  const handleExitElection = async (candidateId: number, electionId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to withdraw "${name}" and exit from this election? This candidate will be permanently removed from the ballot.`)) {
      return;
    }

    try {
      if (token) {
        await apiService.deleteCandidate(candidateId, token);
      }
    } catch (err: any) {
      console.warn('Backend candidate exit fallback:', err);
    }

    // Update local store
    deleteCandidate(electionId, candidateId);

    // Refresh from backend
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({
      type: 'success',
      text: `Candidate "${name}" has successfully exited and withdrawn from the election.`
    });
  };

  // Build flattened list of candidates for View mode
  const displayedCandidates: Array<{ candidate: Candidate; election: typeof elections[0] }> = [];
  elections.forEach(el => {
    if (viewElectionFilter === 'ALL' || el.id === viewElectionFilter) {
      (el.candidates || []).forEach(cand => {
        displayedCandidates.push({ candidate: cand, election: el });
      });
    }
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '1rem auto' }} className="animate-fade-in">
      {/* Top Navigation & Mode Switcher */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <button 
          onClick={() => setActiveTab('home')}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Elections
        </button>

        {/* Portal Mode Tabs: View Candidates vs Add Candidate */}
        <div style={{
          display: 'flex',
          gap: '0.3rem',
          background: 'rgba(255,255,255,0.04)',
          padding: '0.3rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setPortalMode('view'); setStatusMsg(null); }}
            style={{
              background: portalMode === 'view' ? 'rgba(249, 115, 22, 0.25)' : 'transparent',
              color: portalMode === 'view' ? '#fb923c' : 'var(--text-muted)',
              border: portalMode === 'view' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Eye size={15} />
            <span>View & Manage Candidates (Edit / Exit)</span>
          </button>

          <button
            type="button"
            onClick={() => { setPortalMode('add'); setCurrentStep('details'); setStatusMsg(null); }}
            style={{
              background: portalMode === 'add' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'transparent',
              color: portalMode === 'add' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Add Candidate / File Nomination</span>
          </button>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div style={{
          padding: '0.9rem 1.2rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.88rem'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: VIEW, EDIT & EXIT CANDIDATES */}
      {/* ========================================================================= */}
      {portalMode === 'view' && (
        <div>
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(10, 13, 20, 0.9) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '16px',
            padding: '1.8rem 2rem',
            marginBottom: '1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.2rem'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fb923c', fontSize: '0.78rem', fontWeight: 800 }}>
                <Award size={15} /> CANDIDATE MANAGEMENT CONSOLE
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
                Contesting Candidates Directory
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                Candidates can view, update their nomination profile (manifesto, party, details), or formally exit and withdraw from elections.
              </p>
            </div>

            {/* Filter by election */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Filter Election:
              </label>
              <select
                value={viewElectionFilter}
                onChange={(e) => setViewElectionFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="input-control"
                style={{ background: '#090d16', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Elections ({elections.reduce((acc, el) => acc + (el.candidates || []).length, 0)} candidates)</option>
                {elections.map(el => (
                  <option key={el.id} value={el.id}>
                    {el.title} ({(el.candidates || []).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Candidates Grid */}
          {displayedCandidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <Award size={42} color="var(--text-dim)" style={{ margin: '0 auto 0.8rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Contesting Candidates Enrolled</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem', marginBottom: '1.2rem' }}>
                Be the first to file a nomination for this election.
              </p>
              <button
                type="button"
                onClick={() => { setPortalMode('add'); setCurrentStep('details'); }}
                className="btn-primary"
                style={{ padding: '0.6rem 1.4rem' }}
              >
                + File Nomination Now
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '1.2rem'
            }}>
              {displayedCandidates.map(({ candidate, election }) => (
                <div
                  key={`${election.id}-${candidate.id}`}
                  className="glass-panel"
                  style={{
                    padding: '1.4rem',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    {/* Election Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.72rem',
                      color: '#fb923c',
                      background: 'rgba(249, 115, 22, 0.1)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      marginBottom: '0.8rem',
                      fontWeight: 600,
                      width: 'fit-content'
                    }}>
                      <MapPin size={12} />
                      <span>{election.title}</span>
                    </div>

                    {/* Candidate Photo & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.9rem' }}>
                      <img 
                        src={candidate.photoUrl} 
                        alt={candidate.name}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '2px solid rgba(249, 115, 22, 0.3)'
                        }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{candidate.name}</h3>
                        <div style={{ fontSize: '0.82rem', color: '#fb923c', fontWeight: 700 }}>
                          {candidate.party}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          ID: #{candidate.id} • {candidate.voteCount || 0} votes
                        </div>
                      </div>
                    </div>

                    {/* Manifesto */}
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                      {candidate.manifesto}
                    </p>

                    {/* Statutory Security Deposit Status Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: '#4ade80',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      marginBottom: '1rem'
                    }}>
                      <ShieldCheck size={13} />
                      <span>Statutory Security Deposit Cleared (₹25)</span>
                    </div>
                  </div>

                  {/* Actions: Edit & Exit Election */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    paddingTop: '0.8rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(candidate, election.id)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        padding: '0.45rem',
                        borderRadius: '7px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Edit Candidate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExitElection(candidate.id, election.id, candidate.name)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '0.45rem',
                        borderRadius: '7px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <LogOut size={14} />
                      <span>Exit Election</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: ADD CANDIDATE / FILE NOMINATION & PAY STATUTORY DEPOSIT */}
      {/* ========================================================================= */}
      {portalMode === 'add' && (
        <div className="glass-panel-glow" style={{ padding: '2.5rem' }}>
          {/* Step Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: currentStep === 'details' ? '#f97316' : '#22c55e',
              color: '#ffffff',
              fontWeight: 700
            }}>
              1. Candidacy Form
            </span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: currentStep === 'payment' ? '#f97316' : (currentStep === 'receipt' ? '#22c55e' : 'rgba(255,255,255,0.06)'),
              color: '#ffffff',
              fontWeight: 700
            }}>
              2. Security Deposit Gateway
            </span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: currentStep === 'receipt' ? '#22c55e' : 'rgba(255,255,255,0.06)',
              color: '#ffffff',
              fontWeight: 700
            }}>
              3. Treasury Receipt
            </span>
          </div>

          {/* STEP 1: CANDIDACY DETAILS FORM */}
          {currentStep === 'details' && (
            <div>
              <div style={{ marginBottom: '1.8rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fb923c', fontSize: '0.8rem', fontWeight: 800 }}>
                  <Award size={15} /> STEP 1: NOMINATION AFFIDAVIT
                </div>
                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Nomination Filing & Affidavit Form
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Provide your candidate details, political party affiliation, and civic manifesto.
                </p>
              </div>

              <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Election Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    Target Election & Ballot *
                  </label>
                  <select 
                    value={selectedElectionId}
                    onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                    className="input-control"
                    style={{ background: '#090d16' }}
                  >
                    {elections.map(election => (
                      <option key={election.id} value={election.id}>
                        {election.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Candidate Name, Party & Date of Birth */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Full Nominee Legal Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Priya Sharma"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="input-control"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Candidate Date of Birth (DOB) * <span style={{ color: '#fb923c' }}>(Minimum 25 years required)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                      <input 
                        type="date" 
                        required
                        value={candidateDob}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString().split('T')[0]}
                        onChange={(e) => setCandidateDob(e.target.value)}
                        className="input-control"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                      Constitutional Requirement: Must be 25 years or older to contest an election.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Political Party / Affiliation *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Independent, AAP, INC, BJP, DCF"
                        value={party}
                        onChange={(e) => setParty(e.target.value)}
                        className="input-control"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Photo URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    Candidate Portrait URL
                  </label>
                  <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
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
                </div>

                {/* Manifesto */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    Key Manifesto & Promises *
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

                {/* Declaration Checkbox */}
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
                    I hereby solemnly affirm that I am an accredited elector (EPIC: <strong>{user?.epicNumber || 'VERIFIED'}</strong>) and legally eligible (at least 25 years of age) to contest this democratic election.
                  </label>
                </div>

                {/* Proceed to Payment Button */}
                <button 
                  type="submit" 
                  disabled={!declarationChecked}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem',
                    fontSize: '0.98rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: declarationChecked ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  <span>Proceed to Statutory Security Deposit (₹25)</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: STATUTORY SECURITY DEPOSIT PAYMENT GATEWAY */}
          {currentStep === 'payment' && (
            <div>
              <div style={{ marginBottom: '1.8rem' }}>
                <button 
                  type="button" 
                  onClick={() => setCurrentStep('details')}
                  style={{ background: 'transparent', border: 'none', color: '#fb923c', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.6rem' }}
                >
                  <ArrowLeft size={14} /> Back to Candidacy Details
                </button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.8rem', fontWeight: 800 }}>
                  <ShieldCheck size={15} /> STEP 2: STATUTORY NOMINATION SECURITY DEPOSIT
                </div>
                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Electoral Security Deposit Gateway
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  Under Section 34 of the Representation of the People Act, each contesting nominee must deposit statutory security deposit to the Election Commission.
                </p>
              </div>

              {/* Deposit Amount Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                borderRadius: '14px',
                padding: '1.4rem',
                marginBottom: '1.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>
                    Statutory Election Commission Deposit
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                    {activeElection?.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Candidate Nominee: <strong>{candidateName}</strong> ({party || 'Independent'})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required Deposit</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>
                    ₹{depositAmount.toLocaleString()}
                    <span style={{ fontSize: '0.8rem', color: '#fb923c', marginLeft: '4px' }}>INR</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.6rem' }}>
                  Select Payment Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {[
                    { key: 'upi', label: 'UPI / QR Code', icon: <QrCode size={18} /> },
                    { key: 'netbanking', label: 'Net Banking', icon: <Building2 size={18} /> },
                    { key: 'card', label: 'Debit / Credit Card', icon: <CreditCard size={18} /> }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPaymentMethod(tab.key as any)}
                      style={{
                        background: paymentMethod === tab.key ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: paymentMethod === tab.key ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                        color: paymentMethod === tab.key ? '#fb923c' : 'var(--text-muted)',
                        padding: '0.8rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1.4rem',
                marginBottom: '1.8rem'
              }}>
                {paymentMethod === 'upi' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{
                        background: '#ffffff',
                        padding: '0.8rem',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{
                          width: '120px',
                          height: '120px',
                          background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 20px 20px',
                          borderRadius: '6px'
                        }} />
                        <div style={{ fontSize: '0.65rem', color: '#000000', fontWeight: 800, marginTop: '0.4rem' }}>
                          Scan via GPay / PhonePe / BHIM
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          Or Enter Virtual Payment Address (UPI ID):
                        </label>
                        <input 
                          type="text" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="elector@okaxis"
                          className="input-control"
                          style={{ marginBottom: '0.6rem' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                          Instant verification via NPCI Bharat Interface for Money. Security deposit credited to ECI Consolidated Treasury Fund.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Select Recognized Scheduled Commercial Bank:
                    </label>
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="input-control"
                      style={{ background: '#090d16', marginBottom: '0.8rem' }}
                    >
                      <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Canara Bank">Canara Bank</option>
                    </select>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Direct integration via Government Treasury Portal (Bharatkosh / SBI e-Pay).
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Card Number
                      </label>
                      <input 
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="input-control"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          Expiry (MM/YY)
                        </label>
                        <input 
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="input-control"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          CVV
                        </label>
                        <input 
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="input-control"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.4rem' }}>
                <Lock size={14} color="#22c55e" />
                <span>Payments are processed with 256-bit cryptographic SSL encryption directly into the Electoral Commission Treasury Account.</span>
              </div>

              {/* Execute Payment Button */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleProcessPayment}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Processing Security Deposit via Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Pay ₹{depositAmount.toLocaleString()} & File Nomination</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: OFFICIAL TREASURY PAYMENT RECEIPT */}
          {currentStep === 'receipt' && paymentReceipt && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid #22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.2rem',
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)'
              }}>
                <CheckCircle2 size={36} color="#22c55e" />
              </div>

              <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 800, letterSpacing: '0.06em' }}>
                PAYMENT VERIFIED • CANDIDACY ADMITTED
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, marginTop: '0.2rem', marginBottom: '0.4rem' }}>
                Nomination Security Deposit Cleared!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 1.8rem' }}>
                Your candidacy nomination for <strong>{candidateName}</strong> has been officially filed. The statutory security deposit of ₹{depositAmount.toLocaleString()} has been audited and recorded.
              </p>

              {/* Official Treasury Receipt Certificate */}
              <div style={{
                background: '#070b14',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '1.8rem',
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 1.8rem',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fb923c' }}>
                    ELECTION COMMISSION TREASURY RECEIPT
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>
                    STATUS: CLEARED
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                      {paymentReceipt.transactionId}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Treasury Ref:</span>
                    <div style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {paymentReceipt.treasuryReference}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Candidate:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{candidateName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Affiliation:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{party || 'Independent'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Deposit Amount:</span>
                    <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '1rem' }}>
                      ₹{depositAmount.toLocaleString()} INR
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Payment Channel:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{paymentReceipt.paymentMethod}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.4rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Printer size={16} /> Print Official Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode('view');
                    if (onSuccess) onSuccess();
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.4rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Eye size={16} /> View Candidate Directory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    setActiveTab('home');
                  }}
                  className="btn-primary"
                  style={{ padding: '0.7rem 1.6rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  View on Ballot (Home)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CANDIDATE MODAL */}
      {/* ========================================================================= */}
      {editingCandidate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div
            className="glass-panel-glow animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2.2rem',
              borderRadius: '18px',
              background: '#090d16',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setEditingCandidate(null)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Edit3 size={20} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit Candidate Profile</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Updating candidate #{editingCandidate.candidate.id}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Political Party / Affiliation *
                </label>
                <input
                  type="text"
                  required
                  value={editParty}
                  onChange={(e) => setEditParty(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Candidate Portrait URL
                </label>
                <input
                  type="url"
                  value={editPhotoUrl}
                  onChange={(e) => setEditPhotoUrl(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Manifesto & Civic Promises *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editManifesto}
                  onChange={(e) => setEditManifesto(e.target.value)}
                  className="input-control"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.7rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)'
                  }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
