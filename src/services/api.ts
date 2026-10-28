import { User, Equipment, Station, Loan, EmailReceipt, DashboardSummary } from '../types.ts';

const TOKEN_KEY = 'cuz_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // sends cookies
  });

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  const data = await res.json().catch(() => ({ success: false, error: 'Failed to parse server response' }));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed with HTTP status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async registerStudent(params: {
    studentId: string;
    fullName: string;
    email: string;
    password: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(params: {
    studentId: string;
    fullName: string;
    email: string;
    password: string;
  }): Promise<{ user: User; token: string; message: string }> {
    return this.registerStudent(params);
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe(): Promise<{ user: User }> {
    return await request<{ user: User }>('/api/auth/me');
  },

  async getReceipts(): Promise<{ receipts: EmailReceipt[] }> {
    return await request<{ receipts: EmailReceipt[] }>('/api/auth/receipts');
  },

  // Equipment
  async getCatalog(all?: boolean, category?: string): Promise<{ items: Equipment[] }> {
    const params = new URLSearchParams();
    if (all) params.append('all', 'true');
    if (category) params.append('category', category);
    return await request<{ items: Equipment[] }>(`/api/equipment?${params.toString()}`);
  },

  async createEquipment(data: Partial<Equipment>): Promise<{ item: Equipment }> {
    return await request<{ item: Equipment }>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify({
        objectName: data.object_name,
        category: data.category,
        totalQuantity: data.total_quantity,
        availableQuantity: data.available_quantity,
        status: data.status,
        modelOrSpecs: data.model_or_specs,
      }),
    });
  },

  async updateEquipment(id: number, data: Partial<Equipment>): Promise<{ item: Equipment }> {
    return await request<{ item: Equipment }>(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        objectName: data.object_name,
        category: data.category,
        totalQuantity: data.total_quantity,
        availableQuantity: data.available_quantity,
        status: data.status,
        modelOrSpecs: data.model_or_specs,
      }),
    });
  },

  async adjustStock(id: number, delta: number): Promise<{ item: Equipment }> {
    return await request<{ item: Equipment }>(`/api/equipment/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta, adjustTotalToo: true }),
    });
  },

  // Stations
  async getStations(): Promise<{ stations: Station[] }> {
    return await request<{ stations: Station[] }>('/api/stations');
  },

  async getStation(code: string): Promise<{ station: Station }> {
    return await request<{ station: Station }>(`/api/stations/${encodeURIComponent(code)}`);
  },

  async getStationQR(code: string): Promise<{ url: string; dataUrl: string; svg: string; station: Station }> {
    return await request<{ url: string; dataUrl: string; svg: string; station: Station }>(
      `/api/stations/${encodeURIComponent(code)}/qr`
    );
  },

  async createStation(stationCode: string, labName: string, locationDescription?: string): Promise<{ station: Station }> {
    return await request<{ station: Station }>('/api/stations', {
      method: 'POST',
      body: JSON.stringify({ stationCode, labName, locationDescription }),
    });
  },

  // Loans
  async createLoan(data: {
    equipmentId: number;
    quantity: number;
    expectedReturnDate: string;
    stationCode: string;
    notes?: string;
  }): Promise<{ loan: Loan; message: string }> {
    return await request<{ loan: Loan; message: string }>('/api/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyLoans(): Promise<{ loans: Loan[]; upcomingDueLoans: Loan[]; hasOverdue: boolean }> {
    return await request<{ loans: Loan[]; upcomingDueLoans: Loan[]; hasOverdue: boolean }>('/api/loans/mine');
  },

  async getStaffLoans(params?: { status?: string; stationCode?: string; q?: string }): Promise<{ loans: Loan[] }> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.stationCode) q.append('stationCode', params.stationCode);
    if (params?.q) q.append('q', params.q);
    return await request<{ loans: Loan[] }>(`/api/loans?${q.toString()}`);
  },

  async approveLoan(id: number): Promise<{ loan: Loan }> {
    return await request<{ loan: Loan }>(`/api/loans/${id}/approve`, { method: 'PATCH' });
  },

  async rejectLoan(id: number, reason: string): Promise<{ loan: Loan }> {
    return await request<{ loan: Loan }>(`/api/loans/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async returnLoan(id: number, notes?: string): Promise<{ loan: Loan }> {
    return await request<{ loan: Loan }>(`/api/loans/${id}/return`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },

  // Reports & Admin
  async getSummary(): Promise<{ summary: DashboardSummary }> {
    return await request<{ summary: DashboardSummary }>('/api/reports/summary');
  },

  async getOverdue(): Promise<{ overdueList: any[] }> {
    return await request<{ overdueList: any[] }>('/api/reports/overdue');
  },

  async downloadCSV(startDate?: string, endDate?: string, status?: string): Promise<string> {
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    if (status) q.append('status', status);
    return await request<string>(`/api/reports/export.csv?${q.toString()}`);
  },

  async getAuditLogs(): Promise<{ logs: any[] }> {
    return await request<{ logs: any[] }>('/api/reports/audit-logs');
  },

  // User Management
  async listUsers(role?: string): Promise<{ users: User[] }> {
    const q = role ? `?role=${role}` : '';
    return await request<{ users: User[] }>(`/api/users${q}`);
  },

  async createStaff(data: {
    staffId: string;
    fullName: string;
    email: string;
    password: string;
    role: 'technician' | 'admin';
  }): Promise<{ message: string }> {
    return await request<{ message: string }>('/api/users/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUserRole(userId: number, role: string): Promise<{ message: string }> {
    return await request<{ message: string }>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};
