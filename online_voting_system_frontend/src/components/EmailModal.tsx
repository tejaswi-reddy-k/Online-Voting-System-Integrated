import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Mail, X, ShieldCheck, CheckCircle2, Clock, CheckCheck, Lock, UserCheck, Inbox } from 'lucide-react';
import type { EmailNotification } from '../types';

export const EmailModal: React.FC = () => {
  const { user, emailModalOpen, closeEmailModal, emailNotifications, markEmailAsRead, markAllEmailsAsRead, openAuthModal } = useStore();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'REGISTRATION' | 'VOTE_CAST' | 'RESULTS'>('ALL');

  // Filter emails strictly belonging to the currently logged-in user
  const currentUserEmail = user?.email?.toLowerCase() || '';
  const userEmails = currentUserEmail
    ? emailNotifications.filter(e => e.to.toLowerCase() === currentUserEmail)
    : [];

  const unreadCount = userEmails.filter(e => !e.read).length;
  const readCount = userEmails.filter(e => !!e.read).length;

  const filteredEmails = userEmails.filter(e => {
    const matchesStatus = statusFilter === 'ALL'
      ? true
      : statusFilter === 'UNREAD' ? !e.read : !!e.read;

    const matchesType = typeFilter === 'ALL'
      ? true
      : e.type === typeFilter;

    return matchesStatus && matchesType;
  });

  const activeEmail: EmailNotification | undefined = selectedEmailId 
    ? userEmails.find(e => e.id === selectedEmailId) 
    : (filteredEmails[0] || userEmails[0]);

  // When activeEmail is displayed, mark it as read
  useEffect(() => {
    if (activeEmail && !activeEmail.read) {
      markEmailAsRead(activeEmail.id);
    }
  }, [activeEmail?.id]);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    markEmailAsRead(id);
  };

  const handleMarkAllRead = () => {
    if (user?.email) {
      markAllEmailsAsRead(user.email);
    }
  };

  if (!emailModalOpen) return null;

  const getTypeBadge = (type: EmailNotification['type']) => {
    switch (type) {
      case 'REGISTRATION':
        return (
          <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            REGISTRATION
          </span>
        );
      case 'VOTE_CAST':
        return (
          <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            BALLOT RECEIPT
          </span>
        );
      case 'RESULTS':
        return (
          <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            RESULTS
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
      background: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: '960px',
          width: '100%',
          height: '86vh',
          maxHeight: '760px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: '#090d16',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Personalized Elector Mailbox
                </h2>
                {user && (
                  <span style={{
                    fontSize: '0.72rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}>
                    {user.email}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {user 
                  ? `Showing messages specifically dispatched to ${user.fullName} (${user.email})`
                  : 'Log in to view official cryptographic ballot receipts and election notices'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {user && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                title="Mark all your unread messages as read"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}

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
        </div>

        {/* Not Logged In State */}
        {!user ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.2rem',
              color: '#f87171'
            }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Authentication Required for Secure Mailbox
            </h3>
            <p style={{ maxWidth: '480px', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Electronic ballots and audit receipts contain cryptographic proof tied to an elector's identity. To maintain electoral privacy, emails are only accessible after signing in.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => {
                  closeEmailModal();
                  openAuthModal('voter');
                }}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.4rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <UserCheck size={16} />
                <span>Log In as Voter / Admin</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Tabs Bar (Read / Unread + Category Pills) */}
            <div style={{
              padding: '0.75rem 1.8rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.25)',
              flexWrap: 'wrap',
              gap: '0.8rem'
            }}>
              {/* Read / Unread Status Filters */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '0.2rem', fontWeight: 600 }}>STATUS:</span>
                {[
                  { key: 'ALL', label: `All (${userEmails.length})` },
                  { key: 'UNREAD', label: `Unread (${unreadCount})`, highlight: unreadCount > 0 },
                  { key: 'READ', label: `Read (${readCount})` }
                ].map(tab => {
                  const isActive = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key as any)}
                      style={{
                        background: isActive 
                          ? (tab.key === 'UNREAD' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(56, 189, 248, 0.2)') 
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isActive 
                          ? (tab.key === 'UNREAD' ? '#fb923c' : '#38bdf8') 
                          : 'var(--text-muted)',
                        border: isActive 
                          ? (tab.key === 'UNREAD' ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)') 
                          : '1px solid transparent',
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '0.2rem', fontWeight: 600 }}>TYPE:</span>
                {[
                  { key: 'ALL', label: 'All Types' },
                  { key: 'REGISTRATION', label: 'Registration' },
                  { key: 'VOTE_CAST', label: 'Ballots' },
                  { key: 'RESULTS', label: 'Results' }
                ].map(tab => {
                  const isActive = typeFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setTypeFilter(tab.key as any)}
                      style={{
                        background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        color: isActive ? '#f8fafc' : 'var(--text-muted)',
                        border: isActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area: Left list & Right detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', flex: 1, overflow: 'hidden' }}>
              {/* Email List Sidebar */}
              <div style={{
                borderRight: '1px solid var(--border-subtle)',
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.01)'
              }}>
                {filteredEmails.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Inbox size={28} style={{ margin: '0 auto 0.8rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>No messages found</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {statusFilter === 'UNREAD' 
                        ? 'All messages in this mailbox have been marked as read.' 
                        : `No notifications matching current filters for ${user.email}.`}
                    </div>
                  </div>
                ) : (
                  filteredEmails.map((email) => {
                    const isSelected = (activeEmail && activeEmail.id === email.id);
                    const isUnread = !email.read;

                    return (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email.id)}
                        style={{
                          padding: '1rem 1.2rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          background: isSelected 
                            ? 'rgba(56, 189, 248, 0.12)' 
                            : (isUnread ? 'rgba(56, 189, 248, 0.04)' : 'transparent'),
                          borderLeft: isSelected 
                            ? '4px solid #38bdf8' 
                            : (isUnread ? '4px solid #f97316' : '4px solid transparent'),
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Top Meta Line: Badges + Read status dot + Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {getTypeBadge(email.type)}
                            {isUnread ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'rgba(249, 115, 22, 0.2)',
                                color: '#fb923c',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.1rem 0.35rem',
                                borderRadius: '3px',
                                border: '1px solid rgba(249, 115, 22, 0.3)'
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f97316' }} />
                                UNREAD
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                color: '#64748b',
                                fontSize: '0.65rem',
                                fontWeight: 600
                              }}>
                                <CheckCircle2 size={10} color="#64748b" />
                                READ
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '0.7rem', color: isUnread ? '#94a3b8' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={11} /> {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Subject */}
                        <div style={{
                          fontSize: '0.86rem',
                          fontWeight: isUnread ? 800 : 600,
                          color: isUnread ? '#ffffff' : '#94a3b8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {email.subject}
                        </div>

                        {/* Recipient */}
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>To:</span>
                          <span style={{ color: isUnread ? '#38bdf8' : 'var(--text-muted)', fontWeight: isUnread ? 700 : 500 }}>
                            {email.to}
                          </span>
                        </div>

                        {/* Preview */}
                        <div style={{
                          fontSize: '0.75rem',
                          color: isUnread ? '#cbd5e1' : 'var(--text-dim)',
                          marginTop: '0.3rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: isUnread ? 500 : 400
                        }}>
                          {email.preview}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Email Preview Detail Pane */}
              <div style={{ overflowY: 'auto', padding: '1.8rem', background: '#0a0e17' }}>
                {activeEmail ? (
                  <div>
                    {/* Meta details card */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '1.2rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                          {activeEmail.subject}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {getTypeBadge(activeEmail.type)}
                          <span style={{
                            background: activeEmail.read ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                            color: activeEmail.read ? '#34d399' : '#fb923c',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            border: activeEmail.read ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(249, 115, 22, 0.3)'
                          }}>
                            <CheckCircle2 size={12} />
                            {activeEmail.read ? 'Status: Read' : 'Status: Unread'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>From: </span>
                          <strong style={{ color: '#f8fafc' }}>Election Commission &lt;noreply@election-system.org&gt;</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>To (Logged-in Elector): </span>
                          <strong style={{ color: '#38bdf8' }}>{activeEmail.to}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Dispatched: </span>
                          <span style={{ color: '#f8fafc' }}>{new Date(activeEmail.timestamp).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4ade80' }}>
                          <ShieldCheck size={14} />
                          <span style={{ fontWeight: 600 }}>PGP Signed & Verified Delivery</span>
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
                      <span>Cryptographic verification link recorded on National Election Commission Audit Chain.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    Select an email to view full details
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
