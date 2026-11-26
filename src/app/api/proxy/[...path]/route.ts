import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  clearAuthCookies,
  COOKIE,
  getDeviceId,
  jsonError,
  nestFetch,
  setAuthCookies,
  TokenPair,
} from '@/lib/server/nest';

// Proxy: trình duyệt gọi /api/proxy/admin/... -> Next.js gắn token rồi gọi NestJS.
// Access token hết hạn thì tự làm mới 1 lần rồi gọi lại.

// Mỗi refresh token chỉ được dùng 1 lần. Nhiều request cùng lúc phải dùng
// chung 1 lần làm mới, nếu không API tưởng token bị đánh cắp và đăng xuất hết.
const refreshing = new Map<string, Promise<TokenPair | null>>();

async function requestNewTokens(refreshToken: string, device: string) {
  const res = await nestFetch('/auth/refresh', {
    method: 'POST',
    device,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken, deviceId: device }),
  });
  if (res.status >= 500) throw new Error('API lỗi');
  if (!res.ok) return null; // phiên hết hạn hoặc không hợp lệ
  const body = await res.json();
  return body.data.tokens as TokenPair;
}

function refreshTokens(refreshToken: string, device: string) {
  let job = refreshing.get(refreshToken);
  if (!job) {
    job = requestNewTokens(refreshToken, device);
    refreshing.set(refreshToken, job);
    const forget = () => refreshing.delete(refreshToken);
    // thành công thì giữ thêm 10 giây cho request đến trễ, lỗi thì bỏ luôn
    job.then(() => setTimeout(forget, 10_000), forget);
  }
  return job;
}

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  // chỉ cho gọi các API quản trị
  if (params.path[0] !== 'admin') {
    return jsonError(404, 'NOT_FOUND', 'Không tìm thấy');
  }
  // chống CSRF: trang web khác không tự gắn được header này
  if (req.method !== 'GET' && req.headers.get('x-requested-with') !== 'gplx-admin') {
    return jsonError(403, 'CSRF', 'Yêu cầu không hợp lệ');
  }

  const path =
    '/' + params.path.map(encodeURIComponent).join('/') + req.nextUrl.search;
  const body = req.method === 'GET' ? undefined : await req.text();
  const device = getDeviceId();

  const send = (token: string) =>
    nestFetch(path, {
      method: req.method,
      body,
      token,
      device,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    });

  try {
    const token = cookies().get(COOKIE.access)?.value;
    let res = token ? await send(token) : null;
    let newTokens: TokenPair | null = null;

    // chưa có access token hoặc đã hết hạn -> làm mới rồi gọi lại
    if (!res || res.status === 401) {
      const refreshToken = cookies().get(COOKIE.refresh)?.value;
      newTokens = refreshToken
        ? await refreshTokens(refreshToken, device)
        : null;

      if (!newTokens) {
        const out = jsonError(401, 'UNAUTHENTICATED', 'Bạn cần đăng nhập lại');
        clearAuthCookies(out);
        return out;
      }
      res = await send(newTokens.accessToken);
    }

    // trả nguyên kết quả của NestJS về trình duyệt
    const response = new NextResponse(
      res.status === 204 ? null : await res.text(),
      {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (newTokens) setAuthCookies(response, newTokens, device);
    return response;
  } catch {
    return jsonError(503, 'API_UNREACHABLE', 'Không kết nối được máy chủ API');
  }
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };