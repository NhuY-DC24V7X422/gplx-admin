// Hàm gọi API dùng ở PHÍA TRÌNH DUYỆT.
// Trình duyệt chỉ gọi route của Next.js (/api/...), không gọi thẳng NestJS.
// Ngày 11 thêm hàm api() gọi qua /api/proxy cho các trang quản trị.

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
