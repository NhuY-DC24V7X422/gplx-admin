'use client';

import { LogoutOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api-client';

// Trang chủ tạm sau khi đăng nhập.
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
          subTitle="Trang tổng quan và quản lý câu hỏi đang được xây dựng."
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
