export type ElectionStatus = 'UPCOMING' | 'ONGOING' | 'COUNTING' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  dob?: string;
  epicNumber: string; // Voter ID Card (EPIC)
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
  read?: boolean;
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
  dob?: string;
  age?: number;
}

export interface Election {
  id: number;
  title: string;
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
  dob?: string;
  age?: number;
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
  razorpayKeyId?: string;
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

export function isVoteCountLive(election: Election): boolean {
  const now = new Date().getTime();
  const end = new Date(election.endTime).getTime();
  // Live vote count streams ONLY after voting closes and before results are announced
  return now > end && !election.resultsAnnounced;
}

export function getElectionStatus(election: Election): ElectionStatus {
  const now = new Date().getTime();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (now < start) {
    return 'UPCOMING';
  } else if (now >= start && now <= end) {
    return 'ONGOING'; // Polling underway, vote count confidential & sealed
  } else if (now > end && !election.resultsAnnounced) {
    return 'COUNTING'; // Polling closed, vote count streaming live!
  } else {
    return 'COMPLETED'; // Results officially announced and certified
  }
}

export function calculateAge(dobString?: string): number {
  if (!dobString || !dobString.trim()) return 0;
  const birth = new Date(dobString.trim());
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
