import type { BasiqConfig, BasiqUser, BasiqConnection, BasiqAccount, BasiqTransaction } from './types';

export class BasiqService {
  private config: BasiqConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: BasiqConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://au-api.basiq.io/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${this.config.apiKey}`,
        'basiq-version': '3.0'
      },
      body: 'scope=SERVER_ACCESS'
    });

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Failed to obtain access token');
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const token = await this.getAccessToken();
    const baseUrl = 'https://au-api.basiq.io';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'basiq-version': '3.0'
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async createUser(email: string, mobile?: string): Promise<BasiqUser> {
    const userData = await this.makeRequest('/users', 'POST', { email, mobile });
    return userData;
  }

  async getUser(userId: string): Promise<BasiqUser> {
    return this.makeRequest(`/users/${userId}`);
  }

  async getUserByEmail(email: string): Promise<BasiqUser | null> {
    const users = await this.makeRequest(`/users?filter=email.eq('${encodeURIComponent(email)}')`);
    return users.data?.[0] || null;
  }

  async getConnections(userId: string): Promise<BasiqConnection[]> {
    const connections = await this.makeRequest(`/users/${userId}/connections`);
    return connections.data || [];
  }

  async getAccounts(userId: string): Promise<BasiqAccount[]> {
    const accounts = await this.makeRequest(`/users/${userId}/accounts`);
    return accounts.data || [];
  }

  async getTransactions(userId: string, accountId?: string): Promise<BasiqTransaction[]> {
    const endpoint = accountId
      ? `/users/${userId}/accounts/${accountId}/transactions`
      : `/users/${userId}/transactions`;
    
    const transactions = await this.makeRequest(endpoint);
    return transactions.data || [];
  }

  async createAuthLink(userId: string, institutionId: string): Promise<string> {
    const data = await this.makeRequest(`/users/${userId}/auth_link`, 'POST', {
      institutionId,
      mobile: false
    });

    if (!data.links?.public) {
      throw new Error('No auth link URL in response');
    }

    return data.links.public;
  }
}
