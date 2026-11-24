import apiClient from "./apiClient";
import {
  AddSubmissionFeedbackDto,
  CreateTaskSubmissionDto,
  TaskSubmission,
} from "@/types/api.types";

/**
 * Task Submissions Service strictly consuming Swagger /task-submissions endpoints:
 * - POST /task-submissions/{taskId} (submit work via upload or videoUrl)
 * - GET /task-submissions/task/{taskId} (get all versioned submissions for a task)
 * - PATCH /task-submissions/{id}/feedback (add revision feedback & trigger REVISION status)
 */
export const taskSubmissionService = {
  /**
   * Submit work for a specific task
   */
  async createSubmission(
    taskId: string,
    data: FormData | CreateTaskSubmissionDto
  ): Promise<TaskSubmission> {
    let formData: FormData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      if (data.file) formData.append("file", data.file);
      if (data.videoUrl) formData.append("videoUrl", data.videoUrl.trim());
      if (data.notes) formData.append("notes", data.notes.trim());
    }

    const response = await apiClient.post<TaskSubmission>(
      `/task-submissions/${taskId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get versioned submission history for a task (newest first)
   */
  async getSubmissionsByTaskId(taskId: string): Promise<TaskSubmission[]> {
    const response = await apiClient.get<TaskSubmission[]>(
      `/task-submissions/task/${taskId}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Add revision feedback to a submission and mark task for REVISION (Admin only)
   */
  async addFeedback(
    submissionId: string,
    dto: AddSubmissionFeedbackDto
  ): Promise<TaskSubmission> {
    const response = await apiClient.patch<TaskSubmission>(
      `/task-submissions/${submissionId}/feedback`,
      dto
    );
    return response.data;
  },
};

export default taskSubmissionService;
