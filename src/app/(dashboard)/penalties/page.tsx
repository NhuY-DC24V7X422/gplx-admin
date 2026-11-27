'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getPenalties, Penalty } from '@/lib/api-client';
import { formatMoney, VEHICLE_OPTIONS, VEHICLES } from './format';

const COLUMNS: ColumnsType<Penalty> = [
  {
    title: 'Hành vi vi phạm',
    dataIndex: 'violation',
    render: (violation: string, p) => (
      <Link href={`/penalties/${p.id}`}>{violation}</Link>
    ),
  },
  {
    title: 'Loại xe',
    dataIndex: 'vehicleType',
    width: 100,
    render: (type: string) => VEHICLES[type] ?? type,
  },
  {
    title: 'Mức phạt (đồng)',
    width: 220,
    render: (_, p) => `${formatMoney(p.fineMin)} - ${formatMoney(p.fineMax)}`,
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
function PenaltyList() {
  const router = useRouter();
  const params = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') ?? '';
  const vehicleType = params.get('vehicleType') ?? '';

  const { data, isFetching, error } = useQuery({
    queryKey: ['penalties', page, q, vehicleType],
    queryFn: () => getPenalties({ page, limit: 10, q, vehicleType }),
    placeholderData: keepPreviousData,
  });

  function setFilter(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.replace(`/penalties?${next}`);
  }

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Mức phạt
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Hành vi vi phạm (gõ không dấu được)"
          defaultValue={q}
          allowClear
          style={{ width: 360 }}
          onSearch={(value) => setFilter({ q: value.trim(), page: '' })}
        />
        <Select
          style={{ width: 160 }}
          value={vehicleType}
          onChange={(value) => setFilter({ vehicleType: value, page: '' })}
          options={[{ value: '', label: 'Tất cả loại xe' }, ...VEHICLE_OPTIONS]}
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
          showTotal: (total) => `${total} mức phạt`,
          onChange: (p) => setFilter({ page: String(p) }),
        }}
      />
    </>
  );
}

// useSearchParams cần nằm trong <Suspense>
export default function PenaltiesPage() {
  return (
    <Suspense>
      <PenaltyList />
    </Suspense>
  );
}