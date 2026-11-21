'use client';

import { LogoutOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api-client';

// Trang chủ tạm sau khi đăng nhập.
// Ngày 11 thay bằng layout có menu, ngày 15 thêm biểu đồ tổng quan.
export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await logout().catch(() => undefined);
    router.replace('/login');
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: 16 }}>
      <Card>
        <Result
          status="success"
          title="Đăng nhập quản trị thành công"
          subTitle="Trang tổng quan và quản lý câu hỏi sẽ làm ở các ngày tiếp theo."
          extra={
            <Button icon={<LogoutOutlined />} onClick={onLogout} loading={loading}>
              Đăng xuất
            </Button>
          }
        />
      </Card>
    </div>
  );
}
