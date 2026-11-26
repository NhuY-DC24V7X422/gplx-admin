'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getQuestions, Question } from '@/lib/api-client';

// tên 6 chủ đề
const CATEGORIES: Record<string, string> = {
  RULES: 'Quy tắc giao thông',
  CULTURE: 'Văn hóa, đạo đức',
  DRIVING: 'Kỹ thuật lái xe',
  MECHANICS: 'Cấu tạo, sửa chữa',
  SIGNS: 'Báo hiệu đường bộ',
  SITUATION: 'Sa hình, tình huống',
};

const COLUMNS: ColumnsType<Question> = [
  { title: 'Câu', dataIndex: 'number', width: 70 },
  {
    title: 'Nội dung',
    dataIndex: 'content',
    render: (content: string, q) => (
      <Link href={`/questions/${q.id}`}>{content}</Link>
    ),
  },
  {
    title: 'Chủ đề',
    dataIndex: 'categoryCode',
    width: 170,
    render: (code: string) => CATEGORIES[code] ?? code,
  },
  {
    title: 'Điểm liệt',
    dataIndex: 'isCritical',
    width: 100,
    render: (critical: boolean) =>
      critical ? <Tag color="orange">Điểm liệt</Tag> : null,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    width: 110,
    render: (status: string) =>
      status === 'active' ? (
        <Tag color="green">Đang hiện</Tag>
      ) : (
        <Tag>Đang ẩn</Tag>
      ),
  },
  { title: 'Phiên bản', dataIndex: 'version', width: 100 },
];

function QuestionList() {
  const router = useRouter();
  // bộ lọc nằm trên URL: tải lại trang hay bấm Quay lại vẫn giữ nguyên
  const params = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';

  const { data, isFetching, error } = useQuery({
    queryKey: ['questions', page, q, category],
    queryFn: () => getQuestions({ page, limit: 10, q, category }),
    placeholderData: keepPreviousData, // chuyển trang thì bảng không bị trống
  });

  // đổi bộ lọc = đổi URL
  function setFilter(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/questions?${next}`);
  }

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Câu hỏi
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Số câu hoặc nội dung (gõ không dấu được)"
          defaultValue={q}
          allowClear
          style={{ width: 360 }}
          // tìm kiếm mới thì quay về trang 1
          onSearch={(value) => setFilter({ q: value.trim(), page: '' })}
        />
        <Select
          style={{ width: 220 }}
          value={category}
          onChange={(value) => setFilter({ category: value, page: '' })}
          options={[
            { value: '', label: 'Tất cả chủ đề' },
            ...Object.entries(CATEGORIES).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </Space>

      {error && (
        <Alert
          type="error"
          message={error.message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        rowKey="id"
        columns={COLUMNS}
        dataSource={data?.data}
        loading={isFetching}
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize: 10,
          total: data?.meta.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} câu`,
          onChange: (p) => setFilter({ page: String(p) }),
        }}
      />
    </>
  );
}

// useSearchParams cần nằm trong <Suspense>
export default function QuestionsPage() {
  return (
    <Suspense>
      <QuestionList />
    </Suspense>
  );
}