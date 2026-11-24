import apiClient from "./apiClient";
import serviceDepartmentService from "./serviceDepartmentService";
import { CreateServiceTierDto, ServiceTier } from "@/types/api.types";

/**
 * Service Tier Service consuming Swagger /services/{id}/tiers and /services/tiers/{tierId}/status endpoints:
 * - GET: Aggregated across live /services with relational parent metadata
 * - POST /services/{id}/tiers (Add a new pricing tier to a service)
 * - PATCH /services/tiers/{tierId}/status (Toggle isActive status)
 */
export const tierService = {
  /**
   * Fetch all pricing tiers aggregated with parent service details directly from live services
   */
  async getAllTiers(includeInactive = true): Promise<ServiceTier[]> {
    const services = await serviceDepartmentService.getAllServices(includeInactive);
    const flattenedTiers: ServiceTier[] = [];

    for (const s of services) {
      const tiersList = s.tiers || s.pricingTiers || [];
      for (const t of tiersList) {
        flattenedTiers.push({
          ...t,
          serviceId: s.id,
          serviceName: s.name,
          serviceCode: s.code,
        });
      }
    }

    return flattenedTiers;
  },

  /**
   * Add a new pricing tier to a parent service
   */
  async createTier(
    serviceId: string,
    dto: CreateServiceTierDto
  ): Promise<ServiceTier> {
    const response = await apiClient.post<ServiceTier>(
      `/services/${serviceId}/tiers`,
      {
        name: dto.name.trim(),
        defaultRateUsd: Number(dto.defaultRateUsd),
      }
    );
    return response.data;
  },

  /**
   * Toggle tier active/inactive status
   */
  async toggleTierStatus(
    tierId: string,
    isActive: boolean
  ): Promise<ServiceTier> {
    const response = await apiClient.patch<ServiceTier>(
      `/services/tiers/${tierId}/status`,
      null,
      {
        params: { isActive },
      }
    );
    return response.data;
  },
};

export default tierService;
