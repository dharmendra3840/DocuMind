import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  TokenResponse, User, Workspace, Document, DocumentStatusResponse,
  Chunk, Conversation, Message, Source
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({ baseURL: `${BASE_URL}/api/v1`, withCredentials: false });

    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            try {
              const res = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refresh_token: refreshToken });
              this.setAccessToken(res.data.access_token);
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
                return this.client.request(error.config);
              }
            } catch {
              this.clearTokens();
              window.location.href = "/login";
            }
          } else {
            this.clearTokens();
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearTokens() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  // Auth
  async register(email: string, password: string, name?: string): Promise<TokenResponse> {
    const { data } = await this.client.post("/auth/register", { email, password, name });
    return data;
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await this.client.post("/auth/login", { email, password });
    return data;
  }

  async logout(refreshToken: string) {
    await this.client.post("/auth/logout", { refresh_token: refreshToken });
    this.clearTokens();
  }

  // Workspaces
  async listWorkspaces(): Promise<{ workspaces: Workspace[] }> {
    const { data } = await this.client.get("/workspaces");
    return data;
  }

  async createWorkspace(name: string): Promise<Workspace> {
    const { data } = await this.client.post("/workspaces", { name });
    return data;
  }

  async updateWorkspace(id: string, name: string): Promise<Workspace> {
    const { data } = await this.client.patch(`/workspaces/${id}`, { name });
    return data;
  }

  async deleteWorkspace(id: string) {
    await this.client.delete(`/workspaces/${id}`);
  }

  // Documents
  async uploadDocument(file: File, workspaceId: string, onProgress?: (p: number) => void): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", workspaceId);
    const { data } = await this.client.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data;
  }

  async listDocuments(workspaceId: string, page = 1, limit = 20): Promise<{ documents: Document[]; total: number }> {
    const { data } = await this.client.get("/documents", { params: { workspace_id: workspaceId, page, limit } });
    return data;
  }

  async getDocumentStatus(docId: string): Promise<DocumentStatusResponse> {
    const { data } = await this.client.get(`/documents/${docId}/status`);
    return data;
  }

  async getDocumentChunks(docId: string, page = 1, limit = 20): Promise<{ chunks: Chunk[]; total: number }> {
    const { data } = await this.client.get(`/documents/${docId}/chunks`, { params: { page, limit } });
    return data;
  }

  async deleteDocument(docId: string) {
    await this.client.delete(`/documents/${docId}`);
  }

  // Conversations
  async listConversations(workspaceId: string): Promise<{ conversations: Conversation[] }> {
    const { data } = await this.client.get("/conversations", { params: { workspace_id: workspaceId } });
    return data;
  }

  async createConversation(workspaceId: string, title?: string): Promise<Conversation> {
    const { data } = await this.client.post("/conversations", { workspace_id: workspaceId, title });
    return data;
  }

  async getMessages(convId: string, page = 1, limit = 50): Promise<{ messages: Message[]; total: number }> {
    const { data } = await this.client.get(`/conversations/${convId}/messages`, { params: { page, limit } });
    return data;
  }

  async deleteConversation(convId: string) {
    await this.client.delete(`/conversations/${convId}`);
  }

  async renameConversation(convId: string, title: string): Promise<Conversation> {
    const { data } = await this.client.patch(`/conversations/${convId}`, { title });
    return data;
  }

  async deleteMessage(convId: string, msgId: string) {
    await this.client.delete(`/conversations/${convId}/messages/${msgId}`);
  }

  async submitFeedback(convId: string, msgId: string, rating: "up" | "down", comment?: string): Promise<Message> {
    const { data } = await this.client.post(`/conversations/${convId}/messages/${msgId}/feedback`, { rating, comment });
    return data;
  }

  getQueryUrl(convId: string): string {
    return `${BASE_URL}/api/v1/conversations/${convId}/query`;
  }

  getAuthHeader(): string {
    return this.accessToken ? `Bearer ${this.accessToken}` : "";
  }
}

export const apiClient = new ApiClient();
