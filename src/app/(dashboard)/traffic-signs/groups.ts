// tên 6 nhóm biển báo, dùng chung cho trang danh sách và trang sửa
export const SIGN_GROUPS: Record<string, string> = {
  PROHIBITION: 'Biển báo cấm',
  DANGER: 'Biển báo nguy hiểm',
  MANDATORY: 'Biển hiệu lệnh',
  INDICATION: 'Biển chỉ dẫn',
  AUXILIARY: 'Biển phụ',
  OTHER: 'Khác',
};

export const SIGN_GROUP_OPTIONS = Object.entries(SIGN_GROUPS).map(
  ([value, label]) => ({ value, label }),
);