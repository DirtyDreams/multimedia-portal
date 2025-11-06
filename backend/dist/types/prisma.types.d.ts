export declare enum UserRole {
    USER = "USER",
    MODERATOR = "MODERATOR",
    ADMIN = "ADMIN"
}
export interface User {
    id: string;
    email: string;
    username: string;
    password: string;
    name?: string | null;
    profileImage?: string | null;
    role: UserRole;
    emailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    user?: User;
}
export interface Author {
    id: string;
    name: string;
    slug: string;
    bio?: string | null;
    profileImage?: string | null;
    contactEmail?: string | null;
    website?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export type { User as PrismaUser, Session as PrismaSession, UserRole as PrismaUserRole };
