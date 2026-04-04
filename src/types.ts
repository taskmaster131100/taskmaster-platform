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
  // DB columns
  organization_id?: string;
  project_id?: string;
  title: string;
  description?: string;
  notes?: string;
  status: string;
  priority?: string;
  workstream?: string;
  assignee_id?: string;
  reporter_id?: string;
  due_date?: string;
  labels?: string[];
  order_index?: number;
  created_at?: string;
  updated_at?: string;
  // legacy aliases (backwards compat)
  projectId?: string;
  assignedTo?: string;
  dueDate?: string;
  departmentId?: string;
}

export interface Artist {
  id: string;
  name: string;
  artisticName?: string;
  stage_name?: string;
  genre: string;
  subgenre?: string;
  status?: 'active' | 'inactive' | 'archived';
  contactEmail?: string;
  contactPhone?: string;
  email?: string;
  phone?: string;
  bio?: string;
  imageUrl?: string;
  photo_url?: string;
  instagram?: string;
  spotify?: string;
  youtube?: string;
  tiktok?: string;
  organization_id?: string;
  exclusivity?: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  contract_type?: string;
  commissionRate?: number;
  managerId?: string;
  created_by?: string;
  created_at?: string;
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
