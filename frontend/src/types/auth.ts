
export interface CustomerProfile {
  phone_number: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_email_verified: boolean;
  phone_number: string | null;
  date_joined: string;
  customer_profile?: CustomerProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}
