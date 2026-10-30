import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { LiveResults } from './components/LiveResults';
import { VerifyBallot } from './components/VerifyBallot';
import { VoterProfile } from './components/VoterProfile';
import { AdminCenter } from './components/AdminCenter';
import { CandidateRegister } from './components/CandidateRegister';
import { AuthModal } from './components/AuthModal';
import { EmailModal } from './components/EmailModal';
import { apiService } from './services/api';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, elections, setElections } = useStore();

  useEffect(() => {
    // Only load remote defaults if client has not customized elections in localStorage
    const stored = localStorage.getItem('voting_elections');
    if (!stored) {
      apiService.getElections().then(data => {
        if (data && data.length > 0) {
          setElections(data);
        }
      }).catch(() => {
        // keep stored or mock
      });
    }
  }, [setElections]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'home' && (
          <HomePage elections={elections} />
        )}

        {activeTab === 'results' && <LiveResults />}
        {activeTab === 'verify' && <VerifyBallot />}
        {activeTab === 'profile' && <VoterProfile />}
        {activeTab === 'candidate-register' && <CandidateRegister />}
        {activeTab === 'admin' && <AdminCenter />}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <EmailModal />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 13, 20, 0.95)',
        padding: '2.5rem 2rem',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <ShieldCheck size={20} color="#fb923c" />
            <span>ECI MATDAAN • National Democratic Electronic Voting Architecture</span>
          </div>
          <div>
            End-to-End Cryptographic Auditability • Live Stream SSE • Spring Boot & React Vite
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
