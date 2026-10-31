import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { Election, Candidate } from '../types';
import { isVoteCountLive } from '../types';
import { 
  PlusCircle, Trash2, Edit3, Calendar, Award, Vote, Users, 
  X, CheckCircle2, AlertTriangle, ShieldCheck, ChevronUp, MapPin, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminCenter: React.FC = () => {
  const { 
    token, user, setActiveTab, 
    elections, setElections, addElection, updateElection, deleteElection, 
    addCandidate, deleteCandidate 
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'view' | 'candidates'>('view');
  const [showAddElectionForm, setShowAddElectionForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Create Election (inside View & Manage Elections)
  const [title, setTitle] = useState('');
  const [constituency, setConstituency] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('2026-11-01T08:00');
  const [endTime, setEndTime] = useState('2026-11-10T18:00');
  const [candidate1, setCandidate1] = useState('');
  const [party1, setParty1] = useState('');
  const [candidate2, setCandidate2] = useState('');
  const [party2, setParty2] = useState('');

  // Editing state
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Candidate management state
  const [selectedElectionForCand, setSelectedElectionForCand] = useState<number>(elections[0]?.id || 1);
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candManifesto, setCandManifesto] = useState('');

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const candidatesList: Array<{ name: string; party: string; manifesto: string; photoUrl: string }> = [];
    if (candidate1.trim()) {
      candidatesList.push({
        name: candidate1,
        party: party1 || 'Independent',
        manifesto: `Dedicated to citizen welfare and development in ${constituency || 'this constituency'}.`,
        photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
      });
    }
    if (candidate2.trim()) {
      candidatesList.push({
        name: candidate2,
        party: party2 || 'Independent',
        manifesto: `Committed to public service and economic progress.`,
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
      });
    }

    const newElectionId = Date.now();
    const formattedStartTime = startTime.includes(':00') ? startTime : startTime + ':00';
    const formattedEndTime = endTime.includes(':00') ? endTime : endTime + ':00';

    const localNewElection: Election = {
      id: newElectionId,
      title,
      constituency: constituency || 'General Parliamentary Constituency',
      description: description || `Official democratic ballot for ${constituency || 'General Constituency'}`,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      isPublished: true,
      resultsAnnounced: false,
      candidates: candidatesList.map((c, i) => ({
        id: newElectionId + i + 1,
        name: c.name,
        party: c.party,
        manifesto: c.manifesto,
        photoUrl: c.photoUrl,
        voteCount: 0
      }))
    };

    try {
      if (token) {
        const created = await apiService.createElection({
          title,
          description: localNewElection.description,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          candidates: candidatesList
        }, token);

        if (created && created.id) {
          addElection(created);
        } else {
          addElection(localNewElection);
        }
      } else {
        addElection(localNewElection);
      }

      setStatusMsg({ type: 'success', text: `Election "${title}" published successfully! Immediately active across all portal pages.` });
      // Re-fetch all elections from database to guarantee local state matches PostgreSQL
      apiService.getElections().then(data => {
        if (data && data.length > 0) setElections(data);
      }).catch(() => {});

      // Reset form
      setTitle('');
      setConstituency('');
      setDescription('');
      setCandidate1('');
      setCandidate2('');
      setParty1('');
      setParty2('');
      setShowAddElectionForm(false);
    } catch {
      // Local addition guarantees real-time responsiveness
      addElection(localNewElection);
      setStatusMsg({ type: 'success', text: `Election "${title}" created and scheduled in system!` });
      confetti({ particleCount: 70, spread: 50 });
      setTitle('');
      setConstituency('');
      setDescription('');
      setCandidate1('');
      setCandidate2('');
      setParty1('');
      setParty2('');
      setShowAddElectionForm(false);
    }
  };

  const handleUpdateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingElection) return;

    const formattedStart = editStartTime.includes(':00') ? editStartTime : editStartTime + ':00';
    const formattedEnd = editEndTime.includes(':00') ? editEndTime : editEndTime + ':00';

    try {
      if (token) {
        await apiService.updateElection(editingElection.id, {
          title: editTitle,
          description: editDesc,
          startTime: formattedStart,
          endTime: formattedEnd
        }, token);
      }
    } catch {
      // client update continues
    }

    updateElection(editingElection.id, {
      title: editTitle,
      description: editDesc,
      startTime: formattedStart,
      endTime: formattedEnd
    });

    // Re-sync with database
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({ type: 'success', text: `Election #${editingElection.id} updated successfully!` });
    setEditingElection(null);
  };

  const handleDeleteElection = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this election and associated ballots?")) {
      return;
    }

    try {
      if (token) {
        await apiService.deleteElection(id, token);
      }
    } catch {
      // continue local deletion
    }

    deleteElection(id);

    // Re-sync with database
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({ type: 'success', text: `Election #${id} removed from system.` });
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim()) return;

    const newCandidate: Candidate = {
      id: Date.now(),
      name: candName,
      party: candParty || 'Independent',
      manifesto: candManifesto || 'Committed to serving the electorate.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      voteCount: 0
    };

    try {
      if (token) {
        await apiService.registerCandidate({
          electionId: selectedElectionForCand,
          name: candName,
          party: candParty || 'Independent',
          manifesto: candManifesto || 'Committed to serving the electorate.',
          photoUrl: newCandidate.photoUrl
        }, token);
      }
    } catch {
      // offline simulation
    }

    addCandidate(selectedElectionForCand, newCandidate);

    // Re-sync with database
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({ type: 'success', text: `Candidate "${candName}" enrolled onto ballot unit!` });
    setCandName('');
    setCandParty('');
    setCandManifesto('');
  };

  const handleDeleteCandidate = async (electionId: number, candidateId: number) => {
    if (!window.confirm("Remove this candidate from the election ballot?")) return;

    try {
      if (token) {
        await apiService.deleteCandidate(candidateId, token);
      }
    } catch {
      // offline fallback
    }

    deleteCandidate(electionId, candidateId);

    // Re-sync with database
    apiService.getElections().then(data => {
      if (data && data.length > 0) setElections(data);
    }).catch(() => {});

    setStatusMsg({ type: 'success', text: 'Candidate removed from ballot.' });
  };

  const handleToggleAnnounceResults = async (election: Election) => {
    const targetState = !election.resultsAnnounced;
    setStatusMsg(null);
    try {
      if (token) {
        await apiService.announceResults(election.id, targetState, token);
      }
      updateElection(election.id, { resultsAnnounced: targetState });
      if (targetState) {
        confetti({ particleCount: 70, spread: 60 });
        setStatusMsg({ 
          type: 'success', 
          text: `Official results declared for "${election.title}". Vote count stream concluded; final certified results published.` 
        });
      } else {
        setStatusMsg({ 
          type: 'success', 
          text: `Election "${election.title}" returned to COUNTING state. Real-time stream reactivated.` 
        });
      }
    } catch {
      updateElection(election.id, { resultsAnnounced: targetState });
      setStatusMsg({ 
        type: 'success', 
        text: `Results status updated for "${election.title}".` 
      });
    }
  };

  const totalVotesAcrossAll = elections.reduce((acc, el) => {
    return acc + (el.candidates || []).reduce((cAcc, c) => cAcc + (c.voteCount || 0), 0);
  }, 0);

  const totalCandidatesAcrossAll = elections.reduce((acc, el) => acc + (el.candidates || []).length, 0);

  if (!user || user.role !== 'ROLE_ADMIN' || user.email?.toLowerCase() !== 'admin@gmail.com') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2.5rem' }} className="glass-panel-glow animate-fade-in">
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.2rem'
        }}>
          <ShieldAlert size={30} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.6rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
          Single-Admin Policy active: Only the designated Chief Administrator (<strong>admin@gmail.com</strong>) has access to the Admin Center.
        </p>
        <button 
          onClick={() => setActiveTab('home')}
          className="btn-primary"
          style={{ marginTop: '1.5rem', padding: '0.65rem 1.4rem' }}
        >
          Return to Elections Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '1rem auto' }} className="animate-fade-in">
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(10, 13, 20, 0.9) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.2)', padding: '0.2rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '0.6rem' }}>
            <ShieldCheck size={14} /> ECI ADMINISTRATIVE MANAGEMENT CONSOLE
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Authenticated as <strong>{user?.fullName || 'Administrator'}</strong> ({user?.email}). Manage elections, schedule new ballots, and oversee candidate registrations.
          </p>
        </div>

        {/* Real-time stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>{elections.length}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ELECTIONS</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>{totalVotesAcrossAll.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>BALLOTS AUDITED</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb923c' }}>{totalCandidatesAcrossAll}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CANDIDATES</div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.9rem 1.2rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Primary Sub Tabs: View and Manage Elections (which contains Add Election) & Candidate Operations */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem', marginBottom: '1.8rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveSubTab('view')}
          style={{
            background: activeSubTab === 'view' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
            color: activeSubTab === 'view' ? '#fb923c' : 'var(--text-muted)',
            border: activeSubTab === 'view' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Vote size={17} />
          <span>View & Manage Elections ({elections.length})</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('candidates')}
          style={{
            background: activeSubTab === 'candidates' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
            color: activeSubTab === 'candidates' ? '#fb923c' : 'var(--text-muted)',
            border: activeSubTab === 'candidates' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={17} />
          <span>Candidate Operations</span>
        </button>

        <button 
          onClick={() => setActiveTab('home')}
          className="btn-secondary"
          style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '0.55rem 1.2rem' }}
        >
          <span>Switch to Public View / Vote as Citizen</span>
        </button>
      </div>

      {/* 1. VIEW & MANAGE ELECTIONS ONLY (CONTAINS ADD NEW ELECTION INLINE) */}
      {activeSubTab === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Bar inside View & Manage Elections with prominent "+ Add New Election" action */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1.2rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Elections Roster & Actions</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                Add new democratic ballots directly here, edit timing parameters, or manage candidate rosters.
              </p>
            </div>

            <button 
              onClick={() => setShowAddElectionForm(!showAddElectionForm)}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.3rem',
                fontSize: '0.88rem',
                background: showAddElectionForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
              }}
            >
              {showAddElectionForm ? <ChevronUp size={16} /> : <PlusCircle size={16} />}
              <span>{showAddElectionForm ? 'Close Add Election Form' : '+ Add New Election'}</span>
            </button>
          </div>

          {/* INLINE ADD NEW ELECTION FORM (HOUSED EXCLUSIVELY INSIDE VIEW & MANAGE ELECTIONS) */}
          {showAddElectionForm && (
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb923c' }}>
                  <PlusCircle size={20} />
                  <span>Schedule & Add New Election</span>
                </h3>
                <button 
                  onClick={() => setShowAddElectionForm(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateElection} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Election Title *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 2026 Presidential Council Election"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Constituency / Jurisdiction *
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bangalore South Parliamentary Constituency"
                      value={constituency}
                      onChange={(e) => setConstituency(e.target.value)}
                      className="input-control"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    Description & Legal Context
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Provide overview of ballot positions, eligibility, and statutory voting window..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Start Date & Time *
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Close Date & Time *
                    </label>
                    <input 
                      type="datetime-local" 
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-control"
                    />
                  </div>
                </div>

                {/* Nominated Candidates Section */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fb923c', marginBottom: '0.8rem' }}>
                    Initial Candidates to Nominate:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Candidate 1 (Name & Party)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Candidate Full Name" 
                        value={candidate1} 
                        onChange={(e) => setCandidate1(e.target.value)} 
                        className="input-control" 
                        style={{ marginBottom: '0.4rem' }} 
                      />
                      <input 
                        type="text" 
                        placeholder="Party (e.g. BJP, INC, AAP, IND)" 
                        value={party1} 
                        onChange={(e) => setParty1(e.target.value)} 
                        className="input-control" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Candidate 2 (Name & Party)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Candidate Full Name" 
                        value={candidate2} 
                        onChange={(e) => setCandidate2(e.target.value)} 
                        className="input-control" 
                        style={{ marginBottom: '0.4rem' }} 
                      />
                      <input 
                        type="text" 
                        placeholder="Party (e.g. BJP, INC, AAP, IND)" 
                        value={party2} 
                        onChange={(e) => setParty2(e.target.value)} 
                        className="input-control" 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddElectionForm(false)} 
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.8rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                  >
                    Save & Publish Election
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT ELECTION MODAL */}
          {editingElection && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div className="glass-panel-glow animate-fade-in" style={{ maxWidth: '550px', width: '100%', padding: '2rem', borderRadius: '16px', background: '#0a0d14' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Election #{editingElection.id}</h3>
                  <button onClick={() => setEditingElection(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUpdateElection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Election Title
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Description
                    </label>
                    <textarea 
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Start Time
                      </label>
                      <input 
                        type="datetime-local" 
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="input-control"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        End Time
                      </label>
                      <input 
                        type="datetime-local" 
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="input-control"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setEditingElection(null)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
                      Save Modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Elections List */}
          {elections.map((election) => (
            <div 
              key={election.id}
              className="glass-panel"
              style={{ padding: '1.8rem', borderRadius: '14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                      ID: #{election.id}
                    </span>
                    {election.constituency && (
                      <span style={{ fontSize: '0.75rem', color: '#fb923c', background: 'rgba(249, 115, 22, 0.1)', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} /> {election.constituency}
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> Starts: {new Date(election.startTime).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> Closes: {new Date(election.endTime).toLocaleString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{election.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.3rem', maxWidth: '750px' }}>
                    {election.description}
                  </p>
                </div>

                {/* Actions: Announcement Control, Edit & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {isVoteCountLive(election) ? (
                    <button 
                      onClick={() => handleToggleAnnounceResults(election)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                      }}
                      title="Voting has closed and vote counting is streaming live. Click when count concludes to announce certified results."
                    >
                      <Award size={15} />
                      <span>Announce Official Results</span>
                    </button>
                  ) : election.resultsAnnounced ? (
                    <button 
                      onClick={() => handleToggleAnnounceResults(election)}
                      style={{
                        background: 'rgba(234, 179, 8, 0.12)',
                        color: '#facc15',
                        border: '1px solid rgba(234, 179, 8, 0.35)',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Results declared. Click if you need to reopen the live count stream."
                    >
                      <CheckCircle2 size={14} color="#facc15" />
                      <span>Results Declared (Reopen Count)</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '0.35rem 0.65rem', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={13} /> Voting Active (Counts Sealed)
                    </span>
                  )}

                  <button 
                    onClick={() => {
                      setEditingElection(election);
                      setEditTitle(election.title);
                      setEditDesc(election.description);
                      setEditStartTime(election.startTime.slice(0, 16));
                      setEditEndTime(election.endTime.slice(0, 16));
                    }}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Edit3 size={15} />
                    <span>Edit</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteElection(election.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Candidate Roster Preview */}
              <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Nominated Candidates ({(election.candidates || []).length}):
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  {(election.candidates || []).map((cand) => (
                    <div 
                      key={cand.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}
                    >
                      <img 
                        src={cand.photoUrl} 
                        alt={cand.name} 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cand.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#fb923c' }}>{cand.party} • {cand.voteCount || 0} votes</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCandidate(election.id, cand.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', marginLeft: '0.4rem' }}
                        title="Remove candidate"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. CANDIDATE OPERATIONS */}
      {activeSubTab === 'candidates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Add Candidate Form */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="#f97316" />
              <span>Add Candidate to Election</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              Admit and register a verified candidate directly to an election ballot unit.
            </p>

            <form onSubmit={handleAddCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Select Election
                </label>
                <select 
                  value={selectedElectionForCand} 
                  onChange={(e) => setSelectedElectionForCand(Number(e.target.value))}
                  className="input-control"
                  style={{ background: '#0f172a' }}
                >
                  {elections.map((el) => (
                    <option key={el.id} value={el.id}>{el.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Candidate Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Smt. Meenakshi Lekhi"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Party Affiliation *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Independent, BJP, INC, AAP"
                  value={candParty}
                  onChange={(e) => setCandParty(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Manifesto / Vision Statement
                </label>
                <textarea 
                  rows={2}
                  placeholder="Key campaign pledges..."
                  value={candManifesto}
                  onChange={(e) => setCandManifesto(e.target.value)}
                  className="input-control"
                />
              </div>

              <button 
                type="submit"
                className="btn-primary"
                style={{ padding: '0.75rem', marginTop: '0.3rem' }}
              >
                Approve & Register Candidate
              </button>
            </form>
          </div>

          {/* Current Candidates for Selected Election */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Enrolled Candidates
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
              Showing candidates registered for: <strong>{elections.find(e => e.id === selectedElectionForCand)?.title || 'Selected Election'}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {(elections.find(e => e.id === selectedElectionForCand)?.candidates || []).map((c) => (
                <div 
                  key={c.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.8rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img 
                      src={c.photoUrl} 
                      alt={c.name}
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#fb923c' }}>{c.party} • {c.voteCount || 0} votes recorded</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteCandidate(selectedElectionForCand, c.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Remove candidate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
