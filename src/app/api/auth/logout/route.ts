import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  COOKIE,
  getDeviceId,
  nestFetch,
} from '@/lib/server/nest';

// POST /api/auth/logout
// Báo NestJS thu hồi phiên rồi xóa cookie.
export async function POST() {
  const token = cookies().get(COOKIE.access)?.value;
  const device = getDeviceId();

  if (token) {
    // API lỗi cũng kệ, vẫn xóa cookie để người dùng thoát ra được
    await nestFetch('/auth/logout', {
      method: 'POST',
      token,
      device,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: device }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ data: { ok: true } });
  clearAuthCookies(response);
  return response;
}
