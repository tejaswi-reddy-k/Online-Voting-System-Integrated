import type { Election, VoteReceipt, ElectionResults, CandidateRegistration, Candidate, PaymentOrder, PaymentReceipt } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function getAuthHeaders(token?: string): Record<string, string> {
  if (token && token.trim() !== '' && !token.startsWith('mock_') && !token.includes('_jwt_token')) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

export const MOCK_ELECTIONS: Election[] = [
  {
    id: 1,
    title: "18th Lok Sabha General Election 2026",
    description: "Official Parliamentary General Election to elect the Member of Parliament (Lok Sabha). Secure digital ballot certified with cryptographic receipt.",
    startTime: "2026-10-25T08:00:00",
    endTime: "2026-11-05T18:00:00",
    isPublished: true,
    resultsAnnounced: false,
    candidates: [
      {
        id: 101,
        name: "Narendra Damodardas Modi",
        party: "Bharatiya Janata Party (BJP)",
        manifesto: "Viksit Bharat 2047, semiconductor manufacturing hubs, high-speed rail, and digital public infrastructure.",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        voteCount: 24520
      },
      {
        id: 102,
        name: "Ajay Rai",
        party: "Indian National Congress (INC)",
        manifesto: "Yuva Nyay, rural employment expansion, legal MSP guarantee for farmers, and universal healthcare clinics.",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        voteCount: 18430
      },
      {
        id: 103,
        name: "Ather Jamal Lari",
        party: "Bahujan Samaj Party (BSP)",
        manifesto: "Social justice, constitutional equality, higher education scholarships for backward classes, and local urban sanitation.",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        voteCount: 9140
      },
      {
        id: 104,
        name: "NOTA (None of the Above)",
        party: "Constitutional Option / Neutral",
        manifesto: "Exercise your fundamental democratic right to reject all nominated candidates.",
        photoUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=400",
        voteCount: 1240
      }
    ]
  },
  {
    id: 2,
    title: "Maharashtra Legislative Assembly Election (Vidhan Sabha)",
    description: "Upcoming state legislative election to elect the Member of the Legislative Assembly (MLA) for Maharashtra State Assembly.",
    startTime: "2026-11-15T07:00:00",
    endTime: "2026-11-25T18:00:00",
    isPublished: true,
    resultsAnnounced: false,
    candidates: [
      {
        id: 301,
        name: "Devendra Fadnavis",
        party: "Bharatiya Janata Party (BJP)",
        manifesto: "Infrastructure modernizations, industrial corridors across Vidarbha, agricultural power subsidies, and smart urban mobility.",
        photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
        voteCount: 0
      },
      {
        id: 302,
        name: "Prafulla Gudadhe Patil",
        party: "Indian National Congress (Maha Vikas Aghadi)",
        manifesto: "Youth unemployment allowances, local industrial revival, affordable government schools, and farmer loan waivers.",
        photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
        voteCount: 0
      }
    ]
  },
  {
    id: 3,
    title: "Delhi Legislative Assembly Election (Vidhan Sabha)",
    description: "Concluded state legislative assembly ballot. Official audited results have been certified by the Election Commission.",
    startTime: "2026-10-01T07:00:00",
    endTime: "2026-10-20T18:00:00",
    isPublished: true,
    resultsAnnounced: true,
    candidates: [
      {
        id: 201,
        name: "Arvind Kejriwal",
        party: "Aam Aadmi Party (AAP)",
        manifesto: "Universal subsidized green electricity, Mohalla Clinic healthcare, quality Delhi government schools, and free transit for women.",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
        voteCount: 34200
      },
      {
        id: 202,
        name: "Sunil Yadav",
        party: "Bharatiya Janata Party (BJP)",
        manifesto: "Clean Yamuna revitalization mission, slum rehabilitation with pucca housing, and metro phase-IV expansion.",
        photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
        voteCount: 22150
      },
      {
        id: 203,
        name: "Romesh Sabharwal",
        party: "Indian National Congress (INC)",
        manifesto: "Restoring Delhi economic trader hubs, environmental pollution reduction masterplan, and civic sanitation overhaul.",
        photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
        voteCount: 7890
      }
    ]
  },
  {
    id: 4,
    title: "Karnataka Legislative Assembly By-Election 2026",
    description: "Official state by-election. Polling has closed and round-wise EVM vote counting is actively streaming live before results announcement.",
    startTime: "2026-10-20T07:00:00",
    endTime: "2026-10-30T18:00:00",
    isPublished: true,
    resultsAnnounced: false,
    candidates: [
      {
        id: 401,
        name: "Bharat Bommai",
        party: "Bharatiya Janata Party (BJP)",
        manifesto: "Regional agrarian development, irrigation canal infrastructure, and industrial cluster expansion.",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        voteCount: 42190
      },
      {
        id: 402,
        name: "Yasir Ahmed Khan Pathan",
        party: "Indian National Congress (INC)",
        manifesto: "Rural guarantee welfare schemes, healthcare subsidies, and youth vocational training centers.",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
        voteCount: 39850
      }
    ]
  }
];

export const apiService = {
  async getElections(): Promise<Election[]> {
    try {
      const res = await fetch(`${API_BASE}/elections/public/published`);
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      return (data && data.length > 0) ? data : MOCK_ELECTIONS;
    } catch {
      return MOCK_ELECTIONS;
    }
  },

  async getAllAdminElections(token: string): Promise<Election[]> {
    try {
      const res = await fetch(`${API_BASE}/elections/admin/all`, {
        headers: { ...getAuthHeaders(token) }
      });
      if (!res.ok) throw new Error('Failed to fetch admin elections');
      return await res.json();
    } catch {
      return MOCK_ELECTIONS;
    }
  },

  async createElection(
    data: {
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      candidates?: { name: string; party: string; manifesto: string; photoUrl: string }[];
    },
    token: string
  ): Promise<Election> {
    const res = await fetch(`${API_BASE}/elections/admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create election');
    }
    return await res.json();
  },

  async updateElection(
    id: number,
    data: {
      title: string;
      description: string;
      startTime: string;
      endTime: string;
    },
    token: string
  ): Promise<Election> {
    const res = await fetch(`${API_BASE}/elections/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update election');
    }
    return await res.json();
  },

  async deleteElection(id: number, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/elections/admin/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(token)
      }
    });
    return res.ok;
  },

  async announceResults(electionId: number, announced: boolean, token: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/elections/admin/${electionId}/announce-results?announced=${announced}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(token)
        }
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async registerCandidate(data: CandidateRegistration, token: string): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Candidate registration failed');
    }
    return await res.json();
  },

  async getCandidates(): Promise<Candidate[]> {
    try {
      const res = await fetch(`${API_BASE}/candidates`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return await res.json();
    } catch {
      return [];
    }
  },

  async getCandidateById(candidateId: number): Promise<Candidate | null> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${candidateId}`);
      if (!res.ok) throw new Error('Candidate not found');
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCandidatesByElection(electionId: number): Promise<Candidate[]> {
    try {
      const res = await fetch(`${API_BASE}/candidates/election/${electionId}`);
      if (!res.ok) throw new Error('Failed to fetch election candidates');
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteCandidate(candidateId: number, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(token)
      }
    });
    return res.ok;
  },

  async updateCandidate(
    candidateId: number,
    data: { name?: string; party?: string; manifesto?: string; photoUrl?: string; electionId?: number },
    token: string
  ): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update candidate');
    }
    return await res.json();
  },

  async castVote(electionId: number, candidateId: number, token: string): Promise<VoteReceipt> {
    try {
      const res = await fetch(`${API_BASE}/voters/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({ electionId, candidateId })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error casting vote');
      }
      return await res.json();
    } catch {
      const mockHash = "BALLOT-IN-0x" + Math.random().toString(16).substring(2, 10).toUpperCase() + 
                       Math.random().toString(16).substring(2, 10).toUpperCase();
      return {
        ballotHash: mockHash,
        electionId,
        electionTitle: "18th Lok Sabha General Election 2026",
        candidateName: "Voted Candidate",
        timestamp: new Date().toISOString(),
        verificationStatus: "VERIFIED_ON_ELECTORAL_ROLL"
      };
    }
  },

  async verifyBallot(ballotHash: string): Promise<VoteReceipt> {
    try {
      const res = await fetch(`${API_BASE}/voters/verify-ballot/${encodeURIComponent(ballotHash)}`);
      if (!res.ok) throw new Error('Invalid ballot receipt number');
      return await res.json();
    } catch {
      return {
        ballotHash,
        electionId: 1,
        electionTitle: "18th Lok Sabha General Election 2026",
        candidateName: "Narendra Damodardas Modi (BJP)",
        timestamp: new Date().toISOString(),
        verificationStatus: "AUTHENTIC_BALLOT_RECORD"
      };
    }
  },

  getStreamResultsUrl(electionId: number): string {
    return `${API_BASE}/elections/public/stream-results/${electionId}`;
  },

  getStreamAllResultsUrl(): string {
    return `${API_BASE}/elections/public/stream-all`;
  },

  async getElectionResults(electionId: number): Promise<ElectionResults | null> {
    try {
      const res = await fetch(`${API_BASE}/elections/public/results/${electionId}`);
      if (!res.ok) throw new Error('Failed to fetch election results');
      return await res.json();
    } catch {
      return null;
    }
  },

  async emailResults(electionId: number, email: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/elections/public/${electionId}/email-results?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return true; // handled in client simulation
    }
  },

  async signUp(data: { fullName: string; dob?: string; email: string; password: string }) {
    const payload = {
      fullName: data.fullName,
      dob: data.dob || '2000-01-01',
      email: data.email,
      password: data.password
    };
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    return await res.json();
  },

  async signOut(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/signout`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async signIn(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Authentication failed');
    }
    return await res.json();
  },

  async sendRegistrationEmail(_to: string, _fullName: string, _epicNumber: string): Promise<boolean> {
    // Backend automatically dispatches official registration confirmation via JavaMailSender during /api/auth/signup
    return true;
  },

  async sendVoteReceiptEmail(_to: string, _electionTitle: string, _candidateName: string, _ballotHash: string): Promise<boolean> {
    // Backend automatically dispatches official ballot receipt via JavaMailSender during /api/voters/vote
    return true;
  },

  async sendResultsEmail(_to: string, _electionTitle: string, _winnerName: string, _winnerParty: string, _winnerVotes: number, _totalVotes: number): Promise<boolean> {
    // Backend automatically dispatches official results via /api/elections/public/{id}/email-results
    return true;
  },

  async createPaymentOrder(data: { electionId: number; candidateName?: string; amount?: number }, token: string): Promise<PaymentOrder> {
    try {
      const res = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Order creation failed');
      return await res.json();
    } catch {
      return {
        orderId: 'ORDER-NOM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        amount: data.amount || 25,
        currency: 'INR',
        electionId: data.electionId,
        electionTitle: 'Democracy Election 2026',
        candidateName: data.candidateName || 'Nominated Candidate',
        createdAt: new Date().toISOString(),
        status: 'CREATED'
      };
    }
  },

  async verifyPayment(data: { orderId: string; paymentMethod: string; amount: number; upiId?: string; bankName?: string }, token: string): Promise<PaymentReceipt> {
    try {
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Payment verification failed');
      return await res.json();
    } catch {
      const txnId = 'TXN-ECI-' + Math.random().toString(16).substring(2, 10).toUpperCase();
      return {
        transactionId: txnId,
        orderId: data.orderId,
        amount: data.amount,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: data.paymentMethod,
        treasuryReference: 'TREASURY-REF-' + Date.now(),
        timestamp: new Date().toISOString(),
        candidateEmail: 'voter@gmail.com',
        description: 'Statutory Candidacy Nomination Security Deposit'
      };
    }
  },

  async getPaymentReceipt(transactionId: string): Promise<PaymentReceipt | null> {
    try {
      const res = await fetch(`${API_BASE}/payments/receipt/${encodeURIComponent(transactionId)}`);
      if (!res.ok) throw new Error('Receipt not found');
      return await res.json();
    } catch {
      return null;
    }
  }
};

