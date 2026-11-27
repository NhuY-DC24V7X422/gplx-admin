// Hàm gọi API dùng ở PHÍA TRÌNH DUYỆT.
// Trình duyệt chỉ gọi route của Next.js (/api/...), không gọi thẳng NestJS.

// Lỗi có mã `code` giống NestJS (vd: NOT_ADMIN) để màn hình hiện đúng thông báo
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// gửi POST dạng JSON, lỗi thì ném ApiError
async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error ?? 'HTTP_ERROR',
      json?.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
    );
  }
  return json.data as T;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export function login(email: string, password: string) {
  return postJson<{ user: AdminUser }>('/api/auth/login', { email, password });
}

export function logout() {
  return postJson<{ ok: boolean }>('/api/auth/logout');
}
// ----- API quản trị, gọi qua proxy -----

// Câu hỏi API trả về
export interface Question {
  id: string;
  number: number;
  content: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string | null;
  legalRef: string | null;
  categoryCode: string;
  licenseClasses: string[];
  isCritical: boolean;
  status: 'active' | 'hidden';
  version: number;
  answerChangedAt: string | null;
}

// Phần admin được sửa
export type QuestionInput = Pick<
  Question,
  'content' | 'options' | 'correctKey' | 'isCritical' | 'status'
> & { explanation: string; legalRef: string };

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// gọi proxy, trả nguyên JSON { data, meta }
async function proxy<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'gplx-admin', // proxy yêu cầu để chống CSRF
    },
  });
  const json = await res.json().catch(() => null);

  if (res.status === 401) {
    window.location.href = '/login'; // hết phiên thì về trang đăng nhập
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error ?? 'HTTP_ERROR',
      json?.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
    );
  }
  return json as T;
}

function toQueryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, String(value));
  }
  return params.toString();
}

export function getQuestions(query: {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
}) {
  return proxy<{ data: Question[]; meta: PageMeta }>(
    `/admin/questions?${toQueryString(query)}`,
  );
}

export async function getQuestion(id: string) {
  const res = await proxy<{ data: Question }>(`/admin/questions/${id}`);
  return res.data;
}

export async function updateQuestion(id: string, input: QuestionInput) {
  const res = await proxy<{ data: Question }>(`/admin/questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}
// ----- Biển báo -----

export interface TrafficSign {
  id: string;
  code: string; // vd: P.102
  name: string;
  group: string;
  description: string;
  imageUrl: string | null;
  status: 'active' | 'hidden';
  version: number;
}

// Phần admin được sửa (không sửa mã biển và ảnh)
export type TrafficSignInput = Pick<
  TrafficSign,
  'name' | 'group' | 'description' | 'status'
>;

export function getTrafficSigns(query: {
  page?: number;
  limit?: number;
  group?: string;
  q?: string;
}) {
  return proxy<{ data: TrafficSign[]; meta: PageMeta }>(
    `/admin/traffic-signs?${toQueryString(query)}`,
  );
}

export async function getTrafficSign(id: string) {
  const res = await proxy<{ data: TrafficSign }>(`/admin/traffic-signs/${id}`);
  return res.data;
}

export async function updateTrafficSign(id: string, input: TrafficSignInput) {
  const res = await proxy<{ data: TrafficSign }>(`/admin/traffic-signs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}
// ----- Mức phạt -----

export interface Penalty {
  id: string;
  violation: string; // hành vi vi phạm
  vehicleType: 'MOTORBIKE' | 'CAR';
  fineMin: number; // đồng
  fineMax: number;
  additionalPenalty: string | null; // hình phạt bổ sung
  legalRef: string;
  status: 'active' | 'hidden';
  version: number;
}

// Phần admin được sửa
export type PenaltyInput = Omit<
  Penalty,
  'id' | 'version' | 'additionalPenalty'
> & { additionalPenalty: string };

export function getPenalties(query: {
  page?: number;
  limit?: number;
  vehicleType?: string;
  q?: string;
}) {
  return proxy<{ data: Penalty[]; meta: PageMeta }>(
    `/admin/penalties?${toQueryString(query)}`,
  );
}

export async function getPenalty(id: string) {
  const res = await proxy<{ data: Penalty }>(`/admin/penalties/${id}`);
  return res.data;
}

export async function updatePenalty(id: string, input: PenaltyInput) {
  const res = await proxy<{ data: Penalty }>(`/admin/penalties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}