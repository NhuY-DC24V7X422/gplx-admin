import { NextRequest, NextResponse } from 'next/server';
import {
  getDeviceId,
  jsonError,
  nestFetch,
  setAuthCookies,
} from '@/lib/server/nest';

// Trình duyệt gửi { email, password } -> Next.js gọi NestJS /auth/login
// -> lưu token vào cookie httpOnly -> chỉ trả thông tin user cho trình duyệt.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return jsonError(400, 'VALIDATION_FAILED', 'Nhập email và mật khẩu');
  }

  const device = getDeviceId();

  let res: Response;
  try {
    res = await nestFetch('/auth/login', {
      method: 'POST',
      device,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceId: device }),
    });
  } catch {
    // API chưa chạy / sai địa chỉ
    return jsonError(503, 'API_UNREACHABLE', 'Không kết nối được máy chủ API');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // chuyển nguyên lỗi của NestJS về (vd: INVALID_CREDENTIALS, NOT_ADMIN)
    return NextResponse.json(
      body ?? { error: 'HTTP_ERROR', message: 'Đăng nhập thất bại' },
      { status: res.status },
    );
  }

  // KHÔNG trả token về trình duyệt, chỉ trả user
  const response = NextResponse.json({ data: { user: body.data.user } });
  setAuthCookies(response, body.data.tokens, device);
  return response;
}
