import apiClient from "./apiClient";
import {
  CreateTaskDto,
  RejectTaskDto,
  SubmitLinkDto,
  Task,
  TaskStatus,
} from "@/types/api.types";

export interface TaskQueryParams {
  companyId?: string;
  month?: string;
  status?: TaskStatus;
  isUrgent?: boolean;
}

/**
 * Task Service consuming live Swagger /tasks endpoints:
 * - GET /tasks (filtered tasks for calendar & list views)
 * - POST /tasks (create & assign task, locks defaultRateUsd)
 * - GET /tasks/{id} (task details with full versioned submission history)
 * - DELETE /tasks/{id} (delete unapproved task, Admin only)
 * - PATCH /tasks/{id}/urgent (toggle urgent flag, Admin only)
 * - POST /tasks/{id}/submit-link (video editor submission)
 * - POST /tasks/{id}/submit-file (content creator deliverable)
 * - PATCH /tasks/{id}/approve (approve task, locks to payroll cycle)
 * - PATCH /tasks/{id}/reject (request revision with admin feedback)
 */
export const taskService = {
  /**
   * List tasks with optional query filters
   */
  async getAllTasks(params?: TaskQueryParams): Promise<Task[]> {
    const response = await apiClient.get<Task[]>("/tasks", { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get single task with complete versioned submission history
   */
  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Schedule and assign a new task
   */
  async createTask(dto: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>("/tasks", dto);
    return response.data;
  },

  /**
   * Delete an unapproved task (Admin only)
   */
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  /**
   * Toggle urgent status on a task
   */
  async toggleUrgent(id: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/urgent`);
    return response.data;
  },

  /**
   * Submit finished video link (Video Editor)
   */
  async submitLink(id: string, dto: SubmitLinkDto): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/submit-link`, dto);
    return response.data;
  },

  /**
   * Upload finished PDF/DOC deliverable (Content Creator)
   */
  async submitFile(id: string, formData: FormData): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/submit-file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Approve task (turns Green & adds to 10th-of-month payroll cycle)
   */
  async approveTask(id: string): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/approve`);
    return response.data;
  },

  /**
   * Reject task / request revisions with feedback
   */
  async rejectTask(id: string, dto: RejectTaskDto): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/reject`, dto);
    return response.data;
  },
};

export default taskService;
