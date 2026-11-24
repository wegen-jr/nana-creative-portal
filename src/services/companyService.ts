import apiClient from "./apiClient";
import { Company, CreateCompanyDto, UpdateCompanyDto } from "@/types/api.types";

/**
 * Company Service strictly consuming Swagger /companies endpoints:
 * - GET /companies (Get all registered companies)
 * - GET /companies/{id} (Get single registered company by ID)
 * - POST /companies (Register a new company with multipart/form-data)
 * - PATCH /companies/{id} (Update a company with multipart/form-data)
 * - DELETE /companies/{id} (Delete a registered company)
 */
export const companyService = {
  /**
   * Fetch all registered companies directly from the live API
   */
  async getAllCompanies(): Promise<Company[]> {
    const response = await apiClient.get<Company[]>("/companies");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single company by UUID
   */
  async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return response.data;
  },

  /**
   * Register a new company via multipart/form-data
   * Note: Backend whitelist restricts fields strictly to companyName, managerName, managerPhone, date, document
   */
  async createCompany(data: FormData | CreateCompanyDto): Promise<Company> {
    let formData: FormData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      formData.append("companyName", data.companyName.trim());
      formData.append("managerName", data.managerName.trim());
      formData.append("managerPhone", data.managerPhone.trim());
      if (data.date) {
        formData.append("date", data.date);
      }
      if (data.document) {
        formData.append("document", data.document);
      }
    }

    const response = await apiClient.post<Company>("/companies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Update an existing company by UUID via multipart/form-data
   */
  async updateCompany(id: string, data: FormData | UpdateCompanyDto): Promise<Company> {
    let formData: FormData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      if (data.companyName !== undefined) formData.append("companyName", data.companyName.trim());
      if (data.managerName !== undefined) formData.append("managerName", data.managerName.trim());
      if (data.managerPhone !== undefined) formData.append("managerPhone", data.managerPhone.trim());
      if (data.date !== undefined && data.date) formData.append("date", data.date);
      if (data.document !== undefined && data.document !== null) {
        formData.append("document", data.document);
      }
    }

    const response = await apiClient.patch<Company>(`/companies/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Delete a company by UUID
   */
  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },
};

export default companyService;
