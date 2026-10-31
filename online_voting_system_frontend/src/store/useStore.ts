import { create } from 'zustand';
import type { User, VoteReceipt, ElectionStatus, Election, Candidate, EmailNotification } from '../types';
import { MOCK_ELECTIONS } from '../services/api';

const INITIAL_EMAILS: EmailNotification[] = [
  {
    id: 'email-welcome-voter',
    type: 'REGISTRATION',
    to: 'voter@gmail.com',
    subject: 'Welcome to Secure E-Voting Portal - Registered Elector',
    preview: 'Your citizen voting account is verified and ready for participation.',
    body: `Official Voter Registration Confirmation\n========================================\nDear Elector (voter@gmail.com),\n\nWelcome to the Secure Online Voting System. Your digital credentials have been verified on the electoral registry.\n\n• Identity Status: VERIFIED ELECTOR\n• System Audit: Cryptographically Secured (SHA-256)\n\nYou can now review live elections, evaluate candidate manifestos, and cast your democratic ballot.\n\nElection Commission Authority`,
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'email-welcome-admin',
    type: 'REGISTRATION',
    to: 'admin@gmail.com',
    subject: 'ECI Chief Administrator Official Portal Authorization',
    preview: 'Official administrative access granted for managing National Elections.',
    body: `Official Administrator Portal Credentials\n========================================\nDear Chief Administrator (admin@gmail.com),\n\nYour account has been granted full administrative credentials for the National Electronic Voting Infrastructure.\n\n• Role: CHIEF ELECTION ADMINISTRATOR\n• Security Scope: ELECTION CREATION, EDITING, AUDITING & RESULTS MANAGEMENT\n• Protocol: Digital Audit Ledger & Live Stream Synchronization\n\nElection Commission Authority`,
    timestamp: new Date().toISOString(),
    read: false
  }
];

function getStoredElections(): Election[] {
  try {
    const raw = localStorage.getItem('voting_elections');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return MOCK_ELECTIONS;
}

function getStoredEmails(): EmailNotification[] {
  try {
    const raw = localStorage.getItem('voting_emails');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized: EmailNotification[] = parsed.map((e: any) => ({
          ...e,
          to: e.to ? e.to.toLowerCase() : 'voter@gmail.com',
          read: typeof e.read === 'boolean' ? e.read : false
        }));

        const hasVoterWelcome = normalized.some((e: any) => e.to === 'voter@gmail.com');
        const hasAdminWelcome = normalized.some((e: any) => e.to === 'admin@gmail.com');
        const extras: EmailNotification[] = [];
        if (!hasVoterWelcome) extras.push(INITIAL_EMAILS[0]);
        if (!hasAdminWelcome) extras.push(INITIAL_EMAILS[1]);
        return [...extras, ...normalized];
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_EMAILS;
}

interface AppStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeReceipt: VoteReceipt | null;
  selectedElectionId: number | null;
  activeTab: 'home' | 'results' | 'verify' | 'profile' | 'admin' | 'candidate-register';
  selectedStatusFilter: 'ALL' | ElectionStatus;
  authModalOpen: boolean;
  authModalMode: 'voter-login' | 'voter-register' | 'admin-login' | 'voter';
  emailModalOpen: boolean;
  voteHistory: VoteReceipt[];
  elections: Election[];
  emailNotifications: EmailNotification[];

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setActiveReceipt: (receipt: VoteReceipt | null) => void;
  setSelectedElectionId: (id: number | null) => void;
  setActiveTab: (tab: 'home' | 'results' | 'verify' | 'profile' | 'admin' | 'candidate-register') => void;
  setSelectedStatusFilter: (filter: 'ALL' | ElectionStatus) => void;
  openAuthModal: (mode?: 'voter-login' | 'voter-register' | 'admin-login' | 'voter') => void;
  closeAuthModal: () => void;
  openEmailModal: () => void;
  closeEmailModal: () => void;
  addVoteHistory: (receipt: VoteReceipt) => void;

  // Real-time Election Mutations across all pages:
  setElections: (elections: Election[]) => void;
  addElection: (election: Election) => void;
  updateElection: (id: number, updated: Partial<Election>) => void;
  deleteElection: (id: number) => void;
  addCandidate: (electionId: number, candidate: Candidate) => void;
  updateCandidate: (electionId: number, candidateId: number, updated: Partial<Candidate>) => void;
  deleteCandidate: (electionId: number, candidateId: number) => void;
  recordVote: (electionId: number, candidateId: number) => void;

  // Email Notifications:
  addEmailNotification: (notification: Omit<EmailNotification, 'id' | 'timestamp'>) => void;
  markEmailAsRead: (id: string) => void;
  markAllEmailsAsRead: (userEmail?: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  user: JSON.parse(localStorage.getItem('voting_user') || 'null'),
  token: localStorage.getItem('voting_token') || null,
  isAuthenticated: !!localStorage.getItem('voting_token'),
  activeReceipt: null,
  selectedElectionId: 1,
  activeTab: 'home',
  selectedStatusFilter: 'ALL',
  authModalOpen: false,
  authModalMode: 'voter',
  emailModalOpen: false,
  voteHistory: JSON.parse(localStorage.getItem('voting_history') || '[]'),
  elections: getStoredElections(),
  emailNotifications: getStoredEmails(),

  setAuth: (user, token) => {
    localStorage.setItem('voting_user', JSON.stringify(user));
    localStorage.setItem('voting_token', token);
    set({ user, token, isAuthenticated: true, authModalOpen: false });
  },

  logout: () => {
    localStorage.removeItem('voting_user');
    localStorage.removeItem('voting_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      activeReceipt: null,
      activeTab: 'home',
      authModalOpen: false
    });
  },

  setActiveReceipt: (receipt) => set({ activeReceipt: receipt }),
  setSelectedElectionId: (id) => set({ selectedElectionId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedStatusFilter: (filter) => set({ selectedStatusFilter: filter }),
  openAuthModal: (mode = 'voter') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openEmailModal: () => set({ emailModalOpen: true }),
  closeEmailModal: () => set({ emailModalOpen: false }),

  addVoteHistory: (receipt) => set((state) => {
    const updated = [receipt, ...state.voteHistory.filter(v => v.ballotHash !== receipt.ballotHash)];
    localStorage.setItem('voting_history', JSON.stringify(updated));
    return { voteHistory: updated };
  }),

  setElections: (elections) => {
    localStorage.setItem('voting_elections', JSON.stringify(elections));
    set({ elections });
  },

  addElection: (newElection) => set((state) => {
    const updated = [newElection, ...state.elections.filter(e => e.id !== newElection.id)];
    localStorage.setItem('voting_elections', JSON.stringify(updated));
    return { elections: updated };
  }),

  updateElection: (id, updated) => set((state) => {
    const updatedList = state.elections.map((el) => el.id === id ? { ...el, ...updated } : el);
    localStorage.setItem('voting_elections', JSON.stringify(updatedList));
    return { elections: updatedList };
  }),

  deleteElection: (id) => set((state) => {
    const filtered = state.elections.filter(e => e.id !== id);
    localStorage.setItem('voting_elections', JSON.stringify(filtered));
    return { elections: filtered };
  }),

  addCandidate: (electionId, candidate) => set((state) => {
    const updatedList = state.elections.map((el) => {
      if (el.id === electionId) {
        const cands = el.candidates || [];
        return {
          ...el,
          candidates: [...cands.filter(c => c.id !== candidate.id), candidate]
        };
      }
      return el;
    });
    localStorage.setItem('voting_elections', JSON.stringify(updatedList));
    return { elections: updatedList };
  }),

  updateCandidate: (electionId, candidateId, updated) => set((state) => {
    const updatedList = state.elections.map((el) => {
      if (el.id === electionId) {
        const cands = el.candidates || [];
        return {
          ...el,
          candidates: cands.map(c => c.id === candidateId ? { ...c, ...updated } : c)
        };
      }
      return el;
    });
    localStorage.setItem('voting_elections', JSON.stringify(updatedList));
    return { elections: updatedList };
  }),

  deleteCandidate: (electionId, candidateId) => set((state) => {
    const updatedList = state.elections.map((el) => {
      if (el.id === electionId) {
        const cands = el.candidates || [];
        return {
          ...el,
          candidates: cands.filter(c => c.id !== candidateId)
        };
      }
      return el;
    });
    localStorage.setItem('voting_elections', JSON.stringify(updatedList));
    return { elections: updatedList };
  }),

  recordVote: (electionId, candidateId) => set((state) => {
    const updatedList = state.elections.map((el) => {
      if (el.id === electionId) {
        const cands = el.candidates || [];
        return {
          ...el,
          candidates: cands.map((cand) =>
            cand.id === candidateId
              ? { ...cand, voteCount: (cand.voteCount || 0) + 1 }
              : cand
          )
        };
      }
      return el;
    });
    localStorage.setItem('voting_elections', JSON.stringify(updatedList));
    return { elections: updatedList };
  }),

  addEmailNotification: (notification) => set((state) => {
    const newEmail: EmailNotification = {
      ...notification,
      id: 'email-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      read: notification.read !== undefined ? notification.read : false
    };
    const updated = [newEmail, ...state.emailNotifications];
    localStorage.setItem('voting_emails', JSON.stringify(updated));
    return { emailNotifications: updated };
  }),

  markEmailAsRead: (id) => set((state) => {
    const updated = state.emailNotifications.map(email =>
      email.id === id ? { ...email, read: true } : email
    );
    localStorage.setItem('voting_emails', JSON.stringify(updated));
    return { emailNotifications: updated };
  }),

  markAllEmailsAsRead: (userEmail) => set((state) => {
    const target = userEmail?.toLowerCase();
    const updated = state.emailNotifications.map(email => {
      if (!target || email.to.toLowerCase() === target) {
        return { ...email, read: true };
      }
      return email;
    });
    localStorage.setItem('voting_emails', JSON.stringify(updated));
    return { emailNotifications: updated };
  })
}));
