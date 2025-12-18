export interface Project {
  id: string;
  name: string;
  description?: string;
  project_type: 'artist_management' | 'dvd' | 'show' | 'release' | 'custom';
  status: 'active' | 'planning' | 'completed' | 'archived';
  startDate: string;
  budget?: number;
  totalCost?: number;
  ownerId: string;
  members: string[];
  phases?: Phase[];
  whatsappGroup?: string;
  artistId?: string;
  tasks?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  departmentId?: string;
  dependencies?: string[];
}

export interface Artist {
  id: string;
  name: string;
  artisticName?: string;
  genre: string;
  status: 'active' | 'inactive' | 'archived';
  contactEmail?: string;
  contactPhone?: string;
  bio?: string;
  imageUrl?: string;
  exclusivity?: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  commissionRate?: number;
  managerId?: string;
  socialMedia?: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    tiktok?: string;
  };
  financialSummary?: {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  };
  upcomingEvents?: {
    shows: number;
    releases: number;
    meetings: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  avatar?: string;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks?: string[];
}
