import { NextRequest, NextResponse } from 'next/server';

// Middleware chạy TRƯỚC mỗi trang.
// Chưa đăng nhập mà vào trang quản trị -> chuyển về /login?next=<trang đang muốn vào>
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // các trang ai cũng vào được
  const isOpen =
    pathname === '/login' ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/api/'); // route API tự kiểm tra đăng nhập
  if (isOpen) return NextResponse.next();

  // có cookie access hoặc cookie đánh dấu phiên -> coi như đã đăng nhập
  // (kiểm tra token thật sự đúng hay không là việc của NestJS)
  const hasSession =
    req.cookies.get('gplx_access') || req.cookies.get('gplx_session');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// không chạy middleware cho file tĩnh (js, css, ảnh của Next.js)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
