import { UserRole } from '../../../types/prisma.types';
export declare class UserResponseDto {
    id: string;
    email: string;
    username: string;
    name?: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
}
