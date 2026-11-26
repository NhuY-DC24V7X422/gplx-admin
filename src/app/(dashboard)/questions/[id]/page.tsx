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
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import {
  getQuestion,
  Question,
  QuestionInput,
  updateQuestion,
} from '@/lib/api-client';

// Form sửa 1 câu hỏi
function QuestionForm({ question }: { question: Question }) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (input: QuestionInput) => updateQuestion(question.id, input),
    onSuccess: (saved) => {
      message.success(`Đã lưu, phiên bản mới là ${saved.version}`);
      // cập nhật dữ liệu đang hiện, danh sách thì tải lại
      queryClient.setQueryData(['question', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error) => message.error(error.message),
  });

  function onFinish(values: QuestionInput) {
    const input: QuestionInput = {
      ...values,
      // form chỉ giữ ô nội dung đáp án nên ghép lại với mã đáp án cũ
      options: question.options.map((option, i) => ({
        key: option.key,
        text: values.options[i].text.trim(),
      })),
      explanation: values.explanation ?? '',
      legalRef: values.legalRef ?? '',
    };

    // đổi đáp án đúng ảnh hưởng đến tiến độ của người học nên hỏi lại
    if (input.correctKey !== question.correctKey) {
      modal.confirm({
        title: 'Đổi đáp án đúng?',
        content:
          'Các lần trả lời trước đó của câu này sẽ không còn được tính vào tiến độ.',
        okText: 'Vẫn lưu',
        cancelText: 'Xem lại',
        onOk: () => save.mutate(input),
      });
      return;
    }
    save.mutate(input);
  }

  const required = [
    { required: true, whitespace: true, message: 'Không được để trống' },
  ];

  return (
    <Card style={{ maxWidth: 800 }}>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          ...question,
          explanation: question.explanation ?? '',
          legalRef: question.legalRef ?? '',
        }}
      >
        <Form.Item name="content" label="Nội dung câu hỏi" rules={required}>
          <Input.TextArea autoSize={{ minRows: 2 }} maxLength={1000} />
        </Form.Item>

        {question.options.map((option, i) => (
          <Form.Item
            key={option.key}
            name={['options', i, 'text']}
            label={`Đáp án ${option.key}`}
            rules={required}
          >
            <Input maxLength={500} />
          </Form.Item>
        ))}

        <Form.Item name="correctKey" label="Đáp án đúng">
          <Radio.Group
            options={question.options.map((o) => ({
              value: o.key,
              label: `Đáp án ${o.key}`,
            }))}
          />
        </Form.Item>

        <Form.Item name="explanation" label="Giải thích">
          <Input.TextArea autoSize={{ minRows: 2 }} maxLength={2000} />
        </Form.Item>
        <Form.Item name="legalRef" label="Căn cứ pháp luật">
          <Input maxLength={500} />
        </Form.Item>

        <Space size="large" wrap>
          <Form.Item
            name="isCritical"
            label="Câu điểm liệt"
            valuePropName="checked"
          >
            <Switch />
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

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestion(id),
  });

  return (
    <>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()} // quay lại vẫn giữ bộ lọc và trang cũ
        style={{ paddingLeft: 0 }}
      >
        Quay lại
      </Button>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        {data ? `Sửa câu ${data.number}` : 'Sửa câu hỏi'}
      </Typography.Title>

      {isLoading && <Spin />}
      {error && <Alert type="error" message={error.message} showIcon />}
      {/* key theo phiên bản: lưu xong thì form nạp lại dữ liệu mới */}
      {data && <QuestionForm key={data.version} question={data} />}
    </>
  );
}