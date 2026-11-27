'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getTrafficSigns, TrafficSign } from '@/lib/api-client';
import { SIGN_GROUP_OPTIONS, SIGN_GROUPS } from './groups';

const COLUMNS: ColumnsType<TrafficSign> = [
  { title: 'Mã biển', dataIndex: 'code', width: 100 },
  {
    title: 'Tên biển',
    dataIndex: 'name',
    render: (name: string, s) => (
      <Link href={`/traffic-signs/${s.id}`}>{name}</Link>
    ),
  },
  {
    title: 'Nhóm',
    dataIndex: 'group',
    width: 170,
    render: (group: string) => SIGN_GROUPS[group] ?? group,
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

// Giống trang Câu hỏi: bộ lọc nằm trên URL
function SignList() {
  const router = useRouter();
  const params = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') ?? '';
  const group = params.get('group') ?? '';

  const { data, isFetching, error } = useQuery({
    queryKey: ['traffic-signs', page, q, group],
    queryFn: () => getTrafficSigns({ page, limit: 10, q, group }),
    placeholderData: keepPreviousData,
  });

  function setFilter(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/traffic-signs?${next}`);
  }

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Biển báo
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Mã hoặc tên biển (gõ không dấu được)"
          defaultValue={q}
          allowClear
          style={{ width: 360 }}
          onSearch={(value) => setFilter({ q: value.trim(), page: '' })}
        />
        <Select
          style={{ width: 220 }}
          value={group}
          onChange={(value) => setFilter({ group: value, page: '' })}
          options={[{ value: '', label: 'Tất cả nhóm' }, ...SIGN_GROUP_OPTIONS]}
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
        scroll={{ x: 700 }}
        pagination={{
          current: page,
          pageSize: 10,
          total: data?.meta.total ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} biển`,
          onChange: (p) => setFilter({ page: String(p) }),
        }}
      />
    </>
  );
}

// useSearchParams cần nằm trong <Suspense>
export default function TrafficSignsPage() {
  return (
    <Suspense>
      <SignList />
    </Suspense>
  );
}