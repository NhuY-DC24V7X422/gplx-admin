'use client';

import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ApiError, login } from '@/lib/api-client';

interface LoginValues {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams(); // đọc ?next=... trên URL
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // antd gọi hàm này khi form hợp lệ và bấm Đăng nhập
  async function onFinish(values: LoginValues) {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      // đăng nhập xong quay lại trang đang muốn vào (mặc định là trang chủ)
      router.replace(params.get('next') || '/');
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'NOT_ADMIN') {
        setError('Tài khoản không có quyền quản trị');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <Card style={{ width: 380, maxWidth: '100%' }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          GPLX Pro · Quản trị
        </Typography.Title>
        <Typography.Paragraph className="muted">
          Đăng nhập bằng tài khoản có quyền quản trị.
        </Typography.Paragraph>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input prefix={<MailOutlined />} autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}

// useSearchParams cần nằm trong <Suspense> (yêu cầu của Next.js khi build)
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
