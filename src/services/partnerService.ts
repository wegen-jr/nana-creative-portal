import apiClient from "./apiClient";
import { CreatePartnerDto, Partner, UpdatePartnerDto } from "@/types/api.types";

/**
 * Partner Service
 * Note: The Swagger OpenAPI specification (https://nana-backend-2jvy.onrender.com/docs)
 * currently includes Auth, User, and Posts endpoints.
 * The /partners endpoint is pending backend schema completion.
 * Zero-mock policy: No fake arrays or hardcoded mock partners are served.
 */
export const partnerService = {
  async getPartners(): Promise<Partner[]> {
    try {
      const response = await apiClient.get<Partner[]>("/partners");
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      // Endpoint not yet implemented in backend Swagger spec
      return [];
    }
  },

  async createPartner(dto: CreatePartnerDto): Promise<Partner> {
    const response = await apiClient.post<Partner>("/partners", dto);
    return response.data;
  },

  async updatePartner(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const response = await apiClient.patch<Partner>(`/partners/${id}`, dto);
    return response.data;
  },

  async deletePartner(id: string): Promise<void> {
    await apiClient.delete(`/partners/${id}`);
  },
};
