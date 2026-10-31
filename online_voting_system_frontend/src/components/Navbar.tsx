import React from 'react';
import { useStore } from '../store/useStore';
import { Vote, Radio, Search, LogOut, CheckCircle2, ShieldAlert, Award, UserPlus, Lock, Mail } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, activeTab, setActiveTab, openAuthModal, emailNotifications, openEmailModal } = useStore();

  const userEmails = user?.email
    ? emailNotifications.filter(e => e.to.toLowerCase() === user.email.toLowerCase())
    : [];
  const unreadCount = userEmails.filter(e => !e.read).length;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 13, 20, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.85rem 2rem'
    }}>
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', cursor: 'pointer' }}
        >
          {/* Ashoka Chakra / Tricolor Shield */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f97316 0%, #ffffff 50%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            boxShadow: '0 0 20px rgba(249, 115, 22, 0.35)'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#0a0d14',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontWeight: 900,
              fontSize: '1rem'
            }}>
              ECI
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>MATDAAN</span>
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(249, 115, 22, 0.2)', 
                color: '#fb923c', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '4px',
                fontWeight: 700,
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}>DEMOCRATIC PORTAL</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Election Commission of India | Cryptographic E-Voting Architecture
            </div>
          </div>
        </div>

        {/* Public Navigation Tabs (Accessible to all) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('home')}
            style={{
              background: activeTab === 'home' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
              color: activeTab === 'home' ? '#fb923c' : 'var(--text-muted)',
              border: activeTab === 'home' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <Vote size={18} />
            <span>Elections (Home)</span>
          </button>

          {/* Live Stream: Accessible for all without login */}
          <button 
            onClick={() => setActiveTab('results')}
            style={{
              background: activeTab === 'results' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'results' ? '#f87171' : '#fca5a5',
              border: activeTab === 'results' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <Radio size={16} color="#ef4444" className="pulse-indicator" />
            <span>Live Stream (Public)</span>
          </button>

          {/* Public Ballot Verification */}
          <button 
            onClick={() => setActiveTab('verify')}
            style={{
              background: activeTab === 'verify' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
              color: activeTab === 'verify' ? '#fb923c' : 'var(--text-muted)',
              border: activeTab === 'verify' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <Search size={18} />
            <span>Verify Ballot</span>
          </button>

          {/* Quick Register as Candidate */}
          {isAuthenticated && (
            <button 
              onClick={() => setActiveTab('candidate-register')}
              style={{
                background: activeTab === 'candidate-register' ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                color: activeTab === 'candidate-register' ? '#fb923c' : 'var(--text-muted)',
                border: activeTab === 'candidate-register' ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid transparent',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s'
              }}
            >
              <Award size={16} color="#fb923c" />
              <span>Contest / Nominate Candidate</span>
            </button>
          )}

          {/* Admin Control Tab */}
          {user?.role === 'ROLE_ADMIN' && user?.email?.toLowerCase() === 'admin@gmail.com' && (
            <button 
              onClick={() => setActiveTab('admin')}
              style={{
                background: activeTab === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <ShieldAlert size={16} />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* User State & Dedicated Options to Login for Admin and Voter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {/* Email Notification Inbox Trigger */}
          <button
            onClick={openEmailModal}
            style={{
              background: unreadCount > 0 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(56, 189, 248, 0.12)',
              color: unreadCount > 0 ? '#fb923c' : '#38bdf8',
              border: unreadCount > 0 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(56, 189, 248, 0.35)',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
            title={user ? `User Inbox for ${user.email} (${unreadCount} unread)` : "View Email Notifications"}
          >
            <Mail size={15} />
            <span>Emails</span>
            {user ? (
              <span style={{
                background: unreadCount > 0 ? '#f97316' : '#38bdf8',
                color: '#000000',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '0.05rem 0.45rem',
                borderRadius: '9999px',
                boxShadow: unreadCount > 0 ? '0 0 8px rgba(249, 115, 22, 0.6)' : 'none'
              }}>
                {unreadCount > 0 ? `${unreadCount} new` : userEmails.length}
              </span>
            ) : (
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.05rem 0.45rem',
                borderRadius: '9999px'
              }}>
                0
              </span>
            )}
          </button>

          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div 
                onClick={() => {
                  if (user.role === 'ROLE_ADMIN') {
                    setActiveTab('admin');
                  } else {
                    setActiveTab('profile');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                title="View Elector Profile / Dashboard"
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.role === 'ROLE_ADMIN'
                    ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #16a34a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {user.fullName}
                    <CheckCircle2 size={13} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: user.role === 'ROLE_ADMIN' ? '#f87171' : '#fb923c', fontFamily: 'var(--font-mono)' }}>
                    {user.role === 'ROLE_ADMIN' ? 'ADMINISTRATOR' : `EPIC: ${user.epicNumber || 'VERIFIED'}`}
                  </div>
                </div>
              </div>

              <button 
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Sign Out"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Single Unified Voter Login / Register */}
              <button 
                onClick={() => openAuthModal('voter')}
                className="btn-primary"
                style={{
                  fontSize: '0.86rem',
                  padding: '0.5rem 1.1rem',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                }}
              >
                <UserPlus size={15} />
                <span>Voter Login / Register</span>
              </button>

              {/* Admin Login */}
              <button 
                onClick={() => openAuthModal('admin-login')}
                className="btn-secondary"
                style={{
                  fontSize: '0.86rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171'
                }}
              >
                <Lock size={15} />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
