import apiClient from "./apiClient";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "@/types/api.types";

/**
 * User Service strictly consuming Swagger `/user` endpoints:
 * - GET /user (Admin only: list all users)
 * - POST /user (Admin only: create user)
 * - GET /user/{id} (Admin only: fetch user)
 * - PATCH /user/{id} (Admin only: update user)
 * - DELETE /user/{id} (Admin only: delete user)
 */
export const userService = {
  async getAllUsers(): Promise<UserResponseDto[]> {
    const response = await apiClient.get<UserResponseDto[]>("/user");
    return Array.isArray(response.data) ? response.data : [];
  },

  async getUserById(id: string): Promise<UserResponseDto> {
    const response = await apiClient.get<UserResponseDto>(`/user/${id}`);
    return response.data;
  },

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const response = await apiClient.post<UserResponseDto>("/user", dto);
    return response.data;
  },

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const response = await apiClient.patch<UserResponseDto>(`/user/${id}`, dto);
    return response.data;
  },

  async deleteUser(id: string): Promise<UserResponseDto> {
    const response = await apiClient.delete<UserResponseDto>(`/user/${id}`);
    return response.data;
  },
};

export default userService;

