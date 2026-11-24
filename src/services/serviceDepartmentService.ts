import apiClient from "./apiClient";
import {
  CreateServiceDto,
  ServiceDepartment,
  UpdateServiceDto,
} from "@/types/api.types";

/**
 * Service Department Service strictly consuming Swagger /services endpoints:
 * - GET /services (List all services with nested pricing tiers)
 * - GET /services/{id} (Get single service with pricing tiers)
 * - POST /services (Create a new company service department)
 * - PATCH /services/{id} (Update service details or active status)
 */
export const serviceDepartmentService = {
  /**
   * Fetch all services with nested pricing tiers
   */
  async getAllServices(includeInactive = true): Promise<ServiceDepartment[]> {
    const response = await apiClient.get<ServiceDepartment[]>("/services", {
      params: { includeInactive },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single service department by ID with nested tiers
   */
  async getServiceById(id: string): Promise<ServiceDepartment> {
    const response = await apiClient.get<ServiceDepartment>(`/services/${id}`);
    return response.data;
  },

  /**
   * Create a new service department (Admin only)
   */
  async createService(dto: CreateServiceDto): Promise<ServiceDepartment> {
    const response = await apiClient.post<ServiceDepartment>("/services", {
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
    });
    return response.data;
  },

  /**
   * Update a service department (Admin only)
   */
  async updateService(
    id: string,
    dto: UpdateServiceDto
  ): Promise<ServiceDepartment> {
    const payload: UpdateServiceDto = {};
    if (dto.code !== undefined) payload.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    const response = await apiClient.patch<ServiceDepartment>(
      `/services/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Soft-deactivate a service department
   */
  async deactivateService(id: string): Promise<ServiceDepartment> {
    return this.updateService(id, { isActive: false });
  },

  /**
   * Activate a service department
   */
  async activateService(id: string): Promise<ServiceDepartment> {
    return this.updateService(id, { isActive: true });
  },
};

export default serviceDepartmentService;
