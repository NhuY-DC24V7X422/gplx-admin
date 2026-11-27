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
  Select,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import {
  getTrafficSign,
  TrafficSign,
  TrafficSignInput,
  updateTrafficSign,
} from '@/lib/api-client';
import { SIGN_GROUP_OPTIONS } from '../groups';

// Form sửa 1 biển báo
function SignForm({ sign }: { sign: TrafficSign }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (input: TrafficSignInput) => updateTrafficSign(sign.id, input),
    onSuccess: (saved) => {
      message.success(`Đã lưu, phiên bản mới là ${saved.version}`);
      queryClient.setQueryData(['traffic-sign', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['traffic-signs'] });
    },
    onError: (error) => message.error(error.message),
  });

  function onFinish(values: TrafficSignInput) {
    save.mutate({
      ...values,
      name: values.name.trim(),
      description: (values.description ?? '').trim(),
    });
  }

  return (
    <Card style={{ maxWidth: 800 }}>
      <Form layout="vertical" onFinish={onFinish} initialValues={sign}>
        <Form.Item
          name="name"
          label="Tên biển"
          rules={[
            { required: true, whitespace: true, message: 'Không được để trống' },
          ]}
        >
          <Input maxLength={200} />
        </Form.Item>

        <Form.Item name="description" label="Ý nghĩa">
          <Input.TextArea autoSize={{ minRows: 3 }} maxLength={2000} />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item name="group" label="Nhóm">
            <Select style={{ width: 220 }} options={SIGN_GROUP_OPTIONS} />
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

export default function EditTrafficSignPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['traffic-sign', id],
    queryFn: () => getTrafficSign(id),
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
        {data ? `Sửa biển ${data.code}` : 'Sửa biển báo'}
      </Typography.Title>

      {isLoading && <Spin />}
      {error && <Alert type="error" message={error.message} showIcon />}
      {/* key theo phiên bản: lưu xong thì form nạp lại dữ liệu mới */}
      {data && <SignForm key={data.version} sign={data} />}
    </>
  );
}