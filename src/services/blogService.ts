import apiClient from "./apiClient";
import { Post } from "@/types/api.types";

/**
 * Strict Zero-Mock Blog Service
 * Exclusively consumes live Swagger /posts endpoints:
 * - GET /posts (ordered by creation date with signed AWS Neon image URLs)
 * - GET /posts/{id}
 * - POST /posts (multipart/form-data: title, description, file)
 * - PATCH /posts/{id} (multipart/form-data: title, description, file)
 * - DELETE /posts/{id}
 */
export const blogService = {
  /**
   * Fetch all blog posts directly from Swagger GET /posts
   */
  async getAllPosts(): Promise<Post[]> {
    const response = await apiClient.get<Post[]>("/posts");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch a single post by UUID from Swagger GET /posts/{id}
   */
  async getPostById(id: string): Promise<Post> {
    const response = await apiClient.get<Post>(`/posts/${id}`);
    return response.data;
  },

  /**
   * Create a new post via Swagger POST /posts with multipart/form-data
   */
  async createPost(formData: FormData): Promise<Post> {
    const response = await apiClient.post<Post>("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Update a post via Swagger PATCH /posts/{id} with multipart/form-data
   */
  async updatePost(id: string, formData: FormData): Promise<Post> {
    const response = await apiClient.patch<Post>(`/posts/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Delete a post via Swagger DELETE /posts/{id}
   */
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },
};
