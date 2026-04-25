export type JobCategory = 'Barista' | 'Kitchen' | 'Waiters' | 'Cashier' | 'Cleaning Service' | 'Other';
export type JobType = 'Part-time' | 'Full-time';
export type UserRole = 'seeker' | 'owner' | 'admin';
export type ApplicationStatus = 'pending' | 'seen' | 'interview' | 'accepted' | 'rejected';

export interface UserCV {
  id: string;
  name: string;
  url: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  whatsappNumber?: string;
  cvUrl?: string; // Legacy field for backwards compatibility
  cvs?: UserCV[];
  isVerified?: boolean;
}

export interface JobPost {
  id: string;
  ownerId: string;
  outletName: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string; // Detailed string representation
  province: string;
  city: string;
  salary?: string;
  type: JobType;
  status: 'active' | 'closed';
  createdAt: any; // Firestore Timestamp
  whatsappContact?: string;
  posterUrl?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  ownerId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerWhatsApp: string;
  cvUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  submittedAt: any; // Firestore Timestamp
}

export interface AdminRequest {
  id: string;
  ownerId: string;
  requestedTitle: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}
