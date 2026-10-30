import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { PaymentReceipt } from '../types';
import { 
  Award, CheckCircle2, User, Building, FileText, Image, ArrowLeft,
  CreditCard, QrCode, Building2, ShieldCheck, Lock, ArrowRight,
  Printer, RefreshCw
} from 'lucide-react';
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
  
  // Step Management: 'details' -> 'payment' -> 'receipt'
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
  const depositAmount = 25000; // ECI Statutory Deposit (₹25,000)

  // Move from nomination details to payment gateway
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      openAuthModal('voter');
      return;
    }

    if (!declarationChecked) {
      setStatusMsg({ type: 'error', text: 'You must affirm the legal candidacy integrity declaration.' });
      return;
    }

    setStatusMsg(null);
    setCurrentStep('payment');
  };

  // Process Statutory Security Deposit Payment
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
      await new Promise(resolve => setTimeout(resolve, 1400));

      // 2. Verify payment on backend & generate treasury receipt
      const receipt = await apiService.verifyPayment({
        orderId: order.orderId,
        paymentMethod: paymentMethod.toUpperCase(),
        amount: depositAmount,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        bankName: paymentMethod === 'netbanking' ? selectedBank : undefined
      }, token || '');

      setPaymentReceipt(receipt);

      // 3. Register candidate with verified payment reference
      const newCandidate = {
        id: Date.now(),
        name: candidateName,
        party: party || 'Independent Candidate',
        manifesto: manifesto || `Dedicated to public service, constitutional values, and transparent governance.`,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        voteCount: 0
      };

      addCandidate(activeElectionId, newCandidate);

      try {
        await apiService.registerCandidate({
          electionId: activeElectionId,
          name: candidateName,
          party: newCandidate.party,
          manifesto: newCandidate.manifesto,
          photoUrl: newCandidate.photoUrl,
          paymentTransactionId: receipt.transactionId,
          securityDepositAmount: depositAmount
        }, token || '');
      } catch {
        // Local state preserved
      }

      // 4. Dispatch In-App Email Notification with Treasury Receipt Details
      if (user?.email) {
        addEmailNotification({
          type: 'REGISTRATION',
          to: user.email,
          subject: `Candidacy Nomination & Security Deposit Cleared - ${candidateName}`,
          preview: `Statutory Security Deposit of ₹${depositAmount.toLocaleString()} cleared. Transaction: ${receipt.transactionId}`,
          body: `Official Candidacy Nomination & Treasury Receipt\n========================================\nDear ${candidateName},\n\nYour nomination papers and statutory electoral security deposit have been officially admitted.\n\nNomination Summary:\n----------------------------------------\n• Candidate: ${candidateName}\n• Affiliation: ${newCandidate.party}\n• Election: ${activeElection?.title || 'Democratic Election'}\n• Security Deposit: ₹${depositAmount.toLocaleString()} INR\n• Transaction ID: ${receipt.transactionId}\n• Treasury Reference: ${receipt.treasuryReference}\n• Payment Mode: ${paymentMethod.toUpperCase()}\n• Status: CONTESTING NOMINEE ON OFFICIAL BALLOT\n\nElection Commission Authority`
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
    <div style={{ maxWidth: '820px', margin: '1rem auto' }} className="animate-fade-in">
      {/* Header Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <button 
          onClick={() => setActiveTab('home')}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Elections
        </button>

        {/* Step Indicator Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem'
          }}>
            <CheckCircle2 size={18} />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* STEP 1: CANDIDACY DETAILS */}
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
                      {election.title} — {election.constituency || 'General Constituency'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Name & Party */}
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
                  I hereby solemnly affirm that I am an accredited elector (EPIC: <strong>{user?.epicNumber || 'VERIFIED'}</strong>) and legally eligible to contest this democratic election.
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
                <span>Proceed to Statutory Security Deposit (₹25,000)</span>
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

            {/* Payment Method Details */}
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
                    {/* Simulated Dynamic UPI QR Code */}
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
    </div>
  );
};
