'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Statistic, Typography } from 'antd';
import Link from 'next/link';
import { getQuestions } from '@/lib/api-client';

// Trang tổng quan
export default function HomePage() {
  // chỉ cần tổng số câu nên lấy 1 câu cho nhẹ
  const { data, isLoading, error } = useQuery({
    queryKey: ['question-count'],
    queryFn: () => getQuestions({ limit: 1 }),
  });

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Tổng quan
      </Typography.Title>
      {error && <Alert type="error" message={error.message} showIcon />}
      <Card style={{ maxWidth: 280 }}>
        <Statistic
          title="Số câu hỏi"
          value={data?.meta.total ?? 0}
          loading={isLoading}
        />
        <Link href="/questions">Xem danh sách câu hỏi</Link>
      </Card>
    </>
  );
}