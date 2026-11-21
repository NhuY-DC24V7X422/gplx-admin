// Các hàm dùng ở PHÍA SERVER của Next.js để gọi NestJS API.
//
// Mô hình BFF (Backend For Frontend):
//   Trình duyệt  --->  Next.js server (/api/...)  --->  NestJS API
// Token đăng nhập chỉ nằm trong cookie httpOnly: JavaScript trên trình duyệt
// KHÔNG đọc được, nên nếu trang bị chèn mã độc (XSS) thì cũng không lấy được token.

// Dòng này báo lỗi build nếu lỡ import file này vào code chạy trên trình duyệt
import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// địa chỉ NestJS API, bỏ dấu "/" ở cuối nếu có
export const API_BASE_URL = (
  process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1'
).replace(/\/$/, '');

// cookie "secure" = chỉ gửi qua HTTPS. Chạy localhost (http) thì phải tắt.
// Có đặt COOKIE_SECURE thì theo biến đó, không đặt thì bật khi chạy production.
const SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production';

// tên các cookie
export const COOKIE = {
  access: 'gplx_access', // access token (15 phút)
  refresh: 'gplx_refresh', // refresh token (30 ngày)
  device: 'gplx_device', // id "thiết bị" của trình duyệt này
  // cookie không bí mật, chỉ để middleware biết "đang có phiên đăng nhập"
  // (vì cookie refresh chỉ được gửi tới đường dẫn /api nên middleware không thấy)
  session: 'gplx_session',
} as const;

// cặp token NestJS trả về
export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

// lấy id thiết bị từ cookie, chưa có thì tạo mới
export function getDeviceId(): string {
  return (
    cookies().get(COOKIE.device)?.value ?? `admin-web-${crypto.randomUUID()}`
  );
}

// số giây từ giờ tới thời điểm hết hạn (ít nhất 60 giây)
function secondsUntil(isoTime: string) {
  return Math.max(60, Math.floor((Date.parse(isoTime) - Date.now()) / 1000));
}

// Ghi cookie sau khi đăng nhập / làm mới token
export function setAuthCookies(
  res: NextResponse,
  tokens: TokenPair,
  device: string,
) {
  const refreshAge = secondsUntil(tokens.refreshTokenExpiresAt);

  res.cookies.set(COOKIE.access, tokens.accessToken, {
    httpOnly: true, // JS trên trình duyệt không đọc được
    secure: SECURE,
    sameSite: 'lax', // chống gửi cookie từ trang web khác (CSRF)
    path: '/',
    maxAge: secondsUntil(tokens.accessTokenExpiresAt),
  });
  res.cookies.set(COOKIE.refresh, tokens.refreshToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'strict',
    path: '/api', // chỉ gửi kèm khi gọi /api/... (giảm chỗ bị lộ)
    maxAge: refreshAge,
  });
  res.cookies.set(COOKIE.device, device, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 400 * 24 * 3600, // giữ lâu dài
  });
  res.cookies.set(COOKIE.session, '1', {
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: refreshAge,
  });
}

// Xóa cookie khi đăng xuất (maxAge: 0 = hết hạn ngay)
export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(COOKIE.access, '', { path: '/', maxAge: 0 });
  res.cookies.set(COOKIE.refresh, '', { path: '/api', maxAge: 0 });
  res.cookies.set(COOKIE.session, '', { path: '/', maxAge: 0 });
}

// Gọi NestJS kèm các header chuẩn của trang admin
export async function nestFetch(
  path: string,
  init: RequestInit & { token?: string; device?: string } = {},
) {
  const headers = new Headers(init.headers);
  headers.set('X-Client', 'admin'); // để API chặn user thường đăng nhập vào admin
  if (init.device) headers.set('X-Device-Id', init.device);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store', // không cache, luôn lấy dữ liệu mới
  });
}

// Trả lỗi cùng định dạng với NestJS: { statusCode, error, message }
export function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ statusCode: status, error, message }, { status });
}
