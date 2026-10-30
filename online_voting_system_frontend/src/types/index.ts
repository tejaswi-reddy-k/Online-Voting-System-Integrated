export type ElectionStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  dob?: string;
  epicNumber: string; // Voter ID Card (EPIC)
  constituency: string;
  role: 'ROLE_VOTER' | 'ROLE_ADMIN';
  isVerified: boolean;
}

export interface EmailNotification {
  id: string;
  type: 'REGISTRATION' | 'VOTE_CAST' | 'RESULTS';
  to: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Candidate {
  id: number;
  name: string;
  party: string;
  symbolUrl?: string;
  manifesto: string;
  photoUrl: string;
  voteCount: number;
}

export interface Election {
  id: number;
  title: string;
  constituency?: string;
  description: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  resultsAnnounced: boolean;
  candidates: Candidate[];
}

export interface CandidateRegistration {
  electionId: number;
  name: string;
  party: string;
  manifesto: string;
  photoUrl: string;
  paymentTransactionId?: string;
  securityDepositAmount?: number;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  electionId: number;
  electionTitle: string;
  candidateName: string;
  createdAt: string;
  status: string;
}

export interface PaymentReceipt {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  treasuryReference: string;
  timestamp: string;
  candidateEmail: string;
  description: string;
}

export interface VoteReceipt {
  ballotHash: string;
  electionId: number;
  electionTitle: string;
  candidateName: string;
  timestamp: string;
  verificationStatus: string;
}

export interface CandidateResult {
  id: number;
  name: string;
  party: string;
  voteCount: number;
  percentage: number;
}

export interface ElectionResults {
  electionId: number;
  title: string;
  totalVotes: number;
  resultsAnnounced: boolean;
  results: CandidateResult[];
}

export function getElectionStatus(election: Election): ElectionStatus {
  const now = new Date().getTime();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ONGOING';
  } else {
    return 'COMPLETED';
  }
}
