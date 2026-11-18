import apiClient from "./apiClient";
import {
  ContactRequest,
  CreateContactDto,
  UpdateContactDto,
} from "@/types/api.types";

/**
 * Contact Service connecting to the Nana Creative API:
 * - GET /contacts: Retrieve all client contact inquiries (newest first)
 * - GET /contacts/{id}: Retrieve a specific contact inquiry by UUID
 * - POST /contacts: Submit a new contact inquiry
 * - PATCH /contacts/{id}: Update an existing contact inquiry by UUID
 * - DELETE /contacts/{id}: Remove a contact inquiry by UUID
 */
export const contactService = {
  /**
   * Fetch all client contact inquiries
   */
  async getAllContacts(): Promise<ContactRequest[]> {
    const response = await apiClient.get<ContactRequest[]>("/contacts");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single contact inquiry by ID
   */
  async getContactById(id: string): Promise<ContactRequest> {
    const response = await apiClient.get<ContactRequest>(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Submit a new contact inquiry
   */
  async createContact(dto: CreateContactDto): Promise<ContactRequest> {
    const response = await apiClient.post<ContactRequest>("/contacts", dto);
    return response.data;
  },

  /**
   * Update a contact inquiry by ID
   */
  async updateContact(id: string, dto: UpdateContactDto): Promise<ContactRequest> {
    const response = await apiClient.patch<ContactRequest>(`/contacts/${id}`, dto);
    return response.data;
  },

  /**
   * Delete a contact inquiry by ID
   */
  async deleteContact(id: string): Promise<ContactRequest | void> {
    const response = await apiClient.delete<ContactRequest>(`/contacts/${id}`);
    return response.data;
  },
};

export default contactService;
