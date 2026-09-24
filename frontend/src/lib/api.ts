import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  TokenResponse, RefreshResponse, User, Workspace, Document, DocumentStatusResponse,
  Chunk, Conversation, Message, Source
} from "@/types/api";

export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Wired up by the app store (see store/appStore.ts) so the client can read and
// update tokens without importing the store (which imports this module).
interface AuthHooks {
  getRefreshToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken: string) => void;
  onAuthLost: () => void;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private hooks: AuthHooks | null = null;
  private refreshInFlight: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({ baseURL: `${BASE_URL}/api/v1`, withCredentials: false });

    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // On 401, refresh once and replay the request. Auth endpoints are excluded:
    // a 401 from /auth/login means wrong credentials, not an expired session.
    this.client.interceptors.response.use(
      (r) => r,
      async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;
        if (error.response?.status !== 401 || !original || original._retried || original.url?.startsWith("/auth/")) {
          return Promise.reject(error);
        }
        original._retried = true;
        try {
          // If another request already refreshed while this one was in flight,
          // just replay it with the new token instead of refreshing again.
          const current = this.accessToken ? `Bearer ${this.accessToken}` : null;
          const token = current && original.headers.Authorization !== current
            ? this.accessToken!
            : await this.refreshAccessToken();
          original.headers.Authorization = `Bearer ${token}`;
          return this.client.request(original);
        } catch {
          return Promise.reject(error);
        }
      }
    );
  }

  configureAuth(hooks: AuthHooks) {
    this.hooks = hooks;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearTokens() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      // Legacy keys from before tokens lived only in the persisted store.
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  }

  /**
   * Swap the refresh token for a new token pair. Concurrent callers share one
   * request — refresh tokens are single-use, so parallel refreshes would
   * invalidate each other. Signs the user out if the refresh token is rejected.
   */
  refreshAccessToken(): Promise<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.doRefresh().finally(() => { this.refreshInFlight = null; });
    }
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<string> {
    const refreshToken = this.hooks?.getRefreshToken();
    if (!refreshToken) {
      this.hooks?.onAuthLost();
      throw new Error("Not signed in");
    }
    try {
      const { data } = await axios.post<RefreshResponse>(`${BASE_URL}/api/v1/auth/refresh`, { refresh_token: refreshToken });
      this.accessToken = data.access_token;
      // Older backends don't rotate and omit refresh_token; keep the current one then.
      this.hooks?.onTokensRefreshed(data.access_token, data.refresh_token ?? refreshToken);
      return data.access_token;
    } catch (err) {
      // Only a rejected token ends the session; a network blip shouldn't sign the user out.
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        this.hooks?.onAuthLost();
      }
      throw err;
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
