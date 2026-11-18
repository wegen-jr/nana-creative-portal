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
