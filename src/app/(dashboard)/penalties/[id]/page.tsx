'use client';

import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import {
  getPenalty,
  Penalty,
  PenaltyInput,
  updatePenalty,
} from '@/lib/api-client';
import { formatMoney, VEHICLE_OPTIONS } from '../format';

// ô nhập tiền: hiện 4.000.000, gửi lên số 4000000
const moneyProps = {
  min: 0,
  step: 100000,
  style: { width: 200 },
  formatter: (value?: string | number) =>
    value === undefined || value === '' ? '' : formatMoney(Number(value)),
  parser: (text?: string) => Number((text ?? '').replace(/\D/g, '')),
};

// Form sửa 1 mức phạt
function PenaltyForm({ penalty }: { penalty: Penalty }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (input: PenaltyInput) => updatePenalty(penalty.id, input),
    onSuccess: (saved) => {
      message.success(`Đã lưu, phiên bản mới là ${saved.version}`);
      queryClient.setQueryData(['penalty', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
    onError: (error) => message.error(error.message),
  });

  function onFinish(values: PenaltyInput) {
    save.mutate({
      ...values,
      violation: values.violation.trim(),
      additionalPenalty: (values.additionalPenalty ?? '').trim(),
      legalRef: (values.legalRef ?? '').trim(),
    });
  }

  const required = { required: true, message: 'Không được để trống' };

  return (
    <Card style={{ maxWidth: 800 }}>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...penalty,
          additionalPenalty: penalty.additionalPenalty ?? '',
        }}
      >
        <Form.Item
          name="violation"
          label="Hành vi vi phạm"
          rules={[{ ...required, whitespace: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 2 }} maxLength={500} />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item
            name="fineMin"
            label="Phạt thấp nhất (đồng)"
            rules={[required]}
          >
            <InputNumber {...moneyProps} />
          </Form.Item>
          <Form.Item
            name="fineMax"
            label="Phạt cao nhất (đồng)"
            dependencies={['fineMin']}
            rules={[
              required,
              // kiểm tra ngay trên form, giống API kiểm tra lại
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === undefined || value >= getFieldValue('fineMin')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Phải lớn hơn hoặc bằng mức thấp nhất'),
                  );
                },
              }),
            ]}
          >
            <InputNumber {...moneyProps} />
          </Form.Item>
        </Space>

        <Form.Item name="additionalPenalty" label="Hình phạt bổ sung">
          <Input maxLength={500} />
        </Form.Item>
        <Form.Item name="legalRef" label="Căn cứ pháp luật">
          <Input maxLength={300} />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item name="vehicleType" label="Loại xe">
            <Select style={{ width: 160 }} options={VEHICLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              style={{ width: 160 }}
              options={[
                { value: 'active', label: 'Đang hiện' },
                { value: 'hidden', label: 'Đang ẩn' },
              ]}
            />
          </Form.Item>
        </Space>

        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={save.isPending}
          block
        >
          Lưu
        </Button>
      </Form>
    </Card>
  );
}

export default function EditPenaltyPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['penalty', id],
    queryFn: () => getPenalty(id),
  });

  return (
    <>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ paddingLeft: 0 }}
      >
        Quay lại
      </Button>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Sửa mức phạt
      </Typography.Title>

      {isLoading && <Spin />}
      {error && <Alert type="error" message={error.message} showIcon />}
      {/* key theo phiên bản: lưu xong thì form nạp lại dữ liệu mới */}
      {data && <PenaltyForm key={data.version} penalty={data} />}
    </>
  );
}