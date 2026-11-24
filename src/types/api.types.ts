/**
 * TypeScript interfaces strictly generated from the Nana Creative Swagger API:
 * https://nana-backend-2jvy.onrender.com/docs
 */

// ==========================================
// 1. AUTHENTICATION & USER PROFILE PAYLOADS
// ==========================================

export type UserRole = "admin" | "user" | "ADMIN" | "USER";

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  accessToken?: string; // fallback mapping
  token_type?: string;
  user?: UserResponseDto;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "USER";
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "USER";
}

export interface UserProfile extends UserResponseDto {
  bio?: string;
  department?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  password?: string;
  bio?: string;
  department?: string;
  avatarUrl?: string;
}

// ==========================================
// 2. BLOG & POSTS PAYLOADS
// ==========================================

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageKey?: string;
  signedImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  published?: boolean;
  category?: string;
  authorName?: string;
  views?: number;
}

export interface CreatePostDto {
  title: string;
  description: string;
  file?: File | Blob | null;
}

export interface UpdatePostDto {
  title?: string;
  description?: string;
  file?: File | Blob | null;
}

// ==========================================
// 3. PARTNERS PAYLOADS
// ==========================================

export type PartnerTier = "Platinum" | "Gold" | "Silver" | "Creator";
export type PartnerStatus = "Active" | "Pending" | "Archived" | "Review";

export interface Partner {
  id: string;
  name: string;
  contactEmail: string;
  tier: PartnerTier;
  status: PartnerStatus;
  totalViews: number;
  campaignCount: number;
  tiktokHandle?: string;
  instagramHandle?: string;
  avatarUrl?: string;
  joinedAt: string;
  lastActive?: string;
}

export interface CreatePartnerDto {
  name: string;
  contactEmail: string;
  tier: PartnerTier;
  status: PartnerStatus;
  totalViews?: number;
  campaignCount?: number;
  tiktokHandle?: string;
  instagramHandle?: string;
  avatarUrl?: string;
}

export type UpdatePartnerDto = Partial<CreatePartnerDto>;

// ==========================================
// 4. ANALYTICS & OVERVIEW PAYLOADS
// ==========================================

export interface StatsOverview {
  activeCampaigns: number;
  publishedBlogs: number;
  totalPartnerViews: number;
  engagementRate: number;
  activeCampaignsChange: string;
  publishedBlogsChange: string;
  totalPartnerViewsChange: string;
  engagementRateChange: string;
}

export interface TikTokMetricPoint {
  date: string;
  views: number;
  engagements: number;
  likes: number;
  shares: number;
}

export interface CreatorLeaderboardItem {
  id: string;
  name: string;
  handle: string;
  views: number;
  engagements: number;
  growth: string;
  avatar: string;
  tier: PartnerTier;
}

export interface DemographicSegment {
  label: string;
  percentage: number;
  color: string;
}

export interface TikTokAnalytics {
  totalViews: number;
  viewsGrowthPercent: number;
  totalFollowers: number;
  followersGrowthPercent: number;
  engagementRate: number;
  viralScore: number;
  chartData: TikTokMetricPoint[];
  creators: CreatorLeaderboardItem[];
  demographics: DemographicSegment[];
}

// ==========================================
// 5. COMMON API RESPONSES & ERROR SHAPES
// ==========================================

export interface ApiError {
  statusCode?: number;
  message: string | string[];
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

// ==========================================
// 6. CONTACT REQUESTS PAYLOADS (SWAGGER SPEC)
// ==========================================

export type ContactStatus = "pending" | "contacted" | "resolved";

export interface ContactRequest {
  id: string;
  name: string;
  phone: string;
  companyName: string;
  service: string;
  message: string;
  createdAt: string;
  email?: string;
  status?: ContactStatus;
  updatedAt?: string;
}

export type ContactResponseDto = ContactRequest;

export interface CreateContactDto {
  name: string;
  phone: string;
  companyName: string;
  service: string;
  message: string;
}

export interface UpdateContactDto {
  name?: string;
  phone?: string;
  companyName?: string;
  service?: string;
  message?: string;
}

// ==========================================
// 7. COMPANIES PAYLOADS (SWAGGER SPEC)
// ==========================================

export interface Company {
  id: string;
  companyName: string;
  managerName: string;
  managerPhone: string;
  date?: string;
  documentUrl?: string | null;
  documentKey?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Relational mappings if enriched via tasks or selected tier/services
  tierId?: string;
  serviceId?: string;
  tierName?: string;
  serviceNames?: string[];
}

export interface CreateCompanyDto {
  companyName: string;
  managerName: string;
  managerPhone: string;
  date?: string;
  document?: File | Blob | null;
}

export interface UpdateCompanyDto {
  companyName?: string;
  managerName?: string;
  managerPhone?: string;
  date?: string;
  document?: File | Blob | null;
}

// ==========================================
// 8. SERVICES & PRICING TIERS (SWAGGER SPEC)
// ==========================================

export interface ServiceTier {
  id: string;
  name: string;
  defaultRateUsd: number;
  isActive: boolean;
  serviceId?: string;
  serviceCode?: string;
  serviceName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceDepartment {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  tiers?: ServiceTier[];
  pricingTiers?: ServiceTier[];
}

export interface CreateServiceDto {
  code: string;
  name: string;
}

export interface UpdateServiceDto {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreateServiceTierDto {
  name: string;
  defaultRateUsd: number;
}

// ==========================================
// 9. TASKS & CALENDAR WORKFLOW (SWAGGER SPEC)
// ==========================================

export type TaskStatus = "PENDING" | "SUBMITTED" | "REVISION" | "APPROVED";

export interface TaskMetadata {
  durationSec?: number;
  platform?: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  companyId: string;
  serviceId: string;
  tierId: string;
  assignedToId: string;
  title: string;
  postingDate: string;
  postingTime: string;
  rawAssetsUrl?: string;
  brief?: string;
  metadata?: TaskMetadata;
  isUrgent?: boolean;
  status: TaskStatus;
  deadline?: string;
  rateLockedUsd?: number;
  defaultRateUsd?: number;
  createdAt: string;
  updatedAt: string;
  // Populated or resolved relation bindings
  company?: Company;
  service?: ServiceDepartment;
  tier?: ServiceTier;
  assignedTo?: UserResponseDto;
  submissions?: TaskSubmission[];
}

export interface CreateTaskDto {
  companyId: string;
  serviceId: string;
  tierId: string;
  assignedToId: string;
  title: string;
  postingDate: string;
  postingTime: string;
  rawAssetsUrl?: string;
  brief?: string;
  metadata?: Record<string, unknown>;
  isUrgent?: boolean;
}

export interface SubmitLinkDto {
  url: string;
  notes?: string;
}

export interface RejectTaskDto {
  adminFeedback: string;
}

// ==========================================
// 10. TASK SUBMISSIONS (SWAGGER SPEC)
// ==========================================

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  notes?: string;
  adminFeedback?: string;
  status?: TaskStatus | string;
  createdAt: string;
  updatedAt?: string;
  task?: Task;
  user?: UserResponseDto;
}

export interface CreateTaskSubmissionDto {
  taskId: string;
  file?: File | Blob | null;
  videoUrl?: string;
  notes?: string;
}

export interface AddSubmissionFeedbackDto {
  adminFeedback: string;
}

// ==========================================
// 11. PAYROLL & FINANCIAL CYCLES (SWAGGER SPEC)
// ==========================================

export interface PayrollTaskItem {
  taskId: string;
  title: string;
  companyId?: string;
  companyName?: string;
  staffId?: string;
  staffName?: string;
  staffEmail?: string;
  rateUsd: number;
  rateEtb?: number;
  approvedAt?: string;
  status?: string;
}

export interface PayrollStaffGroup {
  staffId: string;
  staffName: string;
  staffEmail?: string;
  role?: string;
  taskCount: number;
  totalUsd: number;
  totalEtb: number;
  tasks?: PayrollTaskItem[];
}

export interface PayrollClientGroup {
  companyId: string;
  companyName: string;
  taskCount: number;
  totalUsd: number;
  totalEtb: number;
  tasks?: PayrollTaskItem[];
}

export interface CurrentPayrollCycleResponse {
  message?: string;
  periodLabel?: string;
  etbRate: number;
  totalUsd: number;
  totalEtb: number;
  totalApprovedTasks?: number;
  byStaff?: PayrollStaffGroup[];
  byClient?: PayrollClientGroup[];
  tasks?: PayrollTaskItem[];
  [key: string]: unknown;
}

export interface ClosePayrollCycleDto {
  periodLabel: string;
  etbRate: number;
  paidOn?: string;
}

export interface PayrollCycle {
  id: string;
  periodLabel: string;
  etbRate: number;
  totalUsd: number;
  totalEtb: number;
  paidOn: string;
  closedAt?: string;
  tasks?: PayrollTaskItem[];
  createdAt?: string;
}

