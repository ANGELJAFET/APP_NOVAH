export type CredentialType = "GED" | "BACHELORS" | "MASTERS" | "PHD" | "CERTIFICATION";

export interface EducationalCredential {
  id: number;
  personId: number;
  type: CredentialType;
  organization: string;
  acquiredCredential: string;
  year: number;
}

export interface Person {
  id: number;
  nit: string;
  name: string;
  address: string;
  phoneNumber: string;
}

export interface PersonWithCredentials extends Person {
  credentials: EducationalCredential[];
}

export interface CredentialInput {
  type: CredentialType;
  organization: string;
  acquiredCredential: string;
  year: number;
}

export interface PersonCreateInput {
  nit: string;
  name: string;
  address: string;
  phoneNumber: string;
  credentials: CredentialInput[];
}

export interface PersonUpdateInput {
  name: string;
  address: string;
  phoneNumber: string;
  credentials: CredentialInput[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
