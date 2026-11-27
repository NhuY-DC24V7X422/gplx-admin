'use client';

import {
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api-client';

const MENU = [
  { key: '/', icon: <DashboardOutlined />, label: <Link href="/">Tổng quan</Link> },
  {
    key: '/questions',
    icon: <QuestionCircleOutlined />,
    label: <Link href="/questions">Câu hỏi</Link>,
  },
  {
    key: '/traffic-signs',
    icon: <WarningOutlined />,
    label: <Link href="/traffic-signs">Biển báo</Link>,
  },
  {
    key: '/penalties',
    icon: <DollarOutlined />,
    label: <Link href="/penalties">Mức phạt</Link>,
  }
];

// Khung chung của các trang quản trị: menu bên trái, nội dung bên phải.
// Thư mục (dashboard) có ngoặc nên không xuất hiện trên URL.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const selected =
    MENU.find((item) => item.key !== '/' && pathname.startsWith(item.key))
      ?.key ?? '/';

  async function onLogout() {
    setLoading(true);
    await logout().catch(() => undefined);
    router.replace('/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider theme="light" breakpoint="lg" collapsedWidth={0}>
        <Typography.Title level={4} style={{ padding: '16px 24px', margin: 0 }}>
          GPLX Pro
        </Typography.Title>
        <Menu mode="inline" items={MENU} selectedKeys={[selected]} />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{ background: '#fff', textAlign: 'right', padding: '0 24px' }}
        >
          <Button icon={<LogoutOutlined />} onClick={onLogout} loading={loading}>
            Đăng xuất
          </Button>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}