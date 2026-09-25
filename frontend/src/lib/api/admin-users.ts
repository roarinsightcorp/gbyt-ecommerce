import {
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";

export type AdminUserRole = "CUSTOMER" | "STAFF";

export interface AdminAccess {
  is_admin: boolean;
  is_super_admin: boolean;
  role: AdminUserRole;
}

export interface AdminUserSummary {
  total_users: number;
  customers: number;
  staff: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
}

export interface AdminCustomerProfile {
  phone_number: string;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStaffProfile {
  job_title: string;
  employee_id: string | null;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: AdminUserRole;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_email_verified: boolean;
  date_joined: string;
  updated_at: string;
  customer_profile: AdminCustomerProfile | null;
  staff_profile: AdminStaffProfile | null;
}

export interface PaginatedAdminUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface AdminUserListParams {
  search?: string;
  role?: AdminUserRole;
  status?: "active" | "inactive";
  verified?: "true" | "false";
  ordering?: string;
  page?: number;
}

export interface AdminUserUpdatePayload {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
}

export interface AdminCustomerProfileUpdatePayload {
  phone_number?: string;
  date_of_birth?: string | null;
}

export interface AdminStaffProfileUpdatePayload {
  job_title?: string;
  employee_id?: string | null;
  phone_number?: string;
}

export interface CreateStaffPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  phone_number?: string;
}

export async function getAdminAccess(): Promise<AdminAccess> {
  return apiGet<AdminAccess>(
    "/admin/access/",
    true
  );
}

export async function getAdminUserSummary(): Promise<AdminUserSummary> {
  return apiGet<AdminUserSummary>(
    "/admin/users/summary/",
    true
  );
}

export async function getAdminUsers(
  params: AdminUserListParams = {}
): Promise<PaginatedAdminUsers> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.role) {
    searchParams.set("role", params.role);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.verified) {
    searchParams.set("verified", params.verified);
  }

  if (params.ordering) {
    searchParams.set("ordering", params.ordering);
  }

  if (params.page) {
    searchParams.set(
      "page",
      String(params.page)
    );
  }

  const query = searchParams.toString();

  return apiGet<PaginatedAdminUsers>(
    `/admin/users/${query ? `?${query}` : ""}`,
    true
  );
}

export async function getAdminUser(
  userId: number
): Promise<AdminUser> {
  return apiGet<AdminUser>(
    `/admin/users/${userId}/`,
    true
  );
}

export async function updateAdminUser(
  userId: number,
  payload: AdminUserUpdatePayload
): Promise<AdminUser> {
  return apiPatch<AdminUser>(
    `/admin/users/${userId}/`,
    payload,
    true
  );
}

export async function updateCustomerProfile(
  userId: number,
  payload: AdminCustomerProfileUpdatePayload
): Promise<AdminCustomerProfile> {
  return apiPatch<AdminCustomerProfile>(
    `/admin/users/${userId}/customer-profile/`,
    payload,
    true
  );
}

export async function updateStaffProfile(
  userId: number,
  payload: AdminStaffProfileUpdatePayload
): Promise<AdminStaffProfile> {
  return apiPatch<AdminStaffProfile>(
    `/admin/users/${userId}/staff-profile/`,
    payload,
    true
  );
}

export async function createStaff(
  payload: CreateStaffPayload
): Promise<AdminUser> {
  return apiPost<AdminUser>(
    "/admin/users/staff/",
    payload,
    true
  );
}