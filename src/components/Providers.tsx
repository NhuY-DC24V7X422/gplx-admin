'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useState } from 'react';

// ngày tháng hiển thị tiếng Việt
dayjs.locale('vi');

// Bọc toàn bộ trang:
// - ConfigProvider: antd hiện tiếng Việt + màu chủ đạo giống app Flutter
// - AntApp: để dùng message/notification của antd
// - QueryClientProvider: React Query (gọi API, cache dữ liệu) – từ ngày 11 mới dùng nhiều
export default function Providers({ children }: { children: React.ReactNode }) {
  // useState để chỉ tạo QueryClient 1 lần, không tạo lại mỗi lần render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // lỗi thì thử lại 1 lần
            refetchOnWindowFocus: false, // quay lại tab không tự gọi lại API
            staleTime: 10_000, // dữ liệu coi là mới trong 10 giây
          },
        },
      }),
  );

  return (
    <ConfigProvider
      locale={viVN}
      theme={{ token: { colorPrimary: '#1F5FBF', borderRadius: 8 } }}
    >
      <AntApp>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
