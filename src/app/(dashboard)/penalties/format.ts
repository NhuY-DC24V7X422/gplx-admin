// tên loại xe, dùng chung cho trang danh sách và trang sửa
export const VEHICLES: Record<string, string> = {
  MOTORBIKE: 'Xe máy',
  CAR: 'Ô tô',
};

export const VEHICLE_OPTIONS = Object.entries(VEHICLES).map(
  ([value, label]) => ({ value, label }),
);

// 4000000 -> "4.000.000"
export function formatMoney(value: number) {
  return value.toLocaleString('vi-VN');
}