import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'GPLX Pro – Quản trị',
  description: 'Trang quản trị dữ liệu ứng dụng ôn thi GPLX',
};

// Layout gốc, bọc mọi trang.
// AntdRegistry: giúp CSS của antd được render sẵn ở server (không bị nháy giao diện lúc tải trang).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
