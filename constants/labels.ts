export const ROLE_LABELS: Record<string, string> = {
  student: 'Sinh viên',
  lecturer: 'Giảng viên',
  admin: 'Quản trị viên',
  club_leader: 'Chủ nhiệm CLB',
};

export const TEAM_STATUS_LABELS: Record<string, string> = {
  recruiting: 'Đang tuyển',
  full: 'Đã đủ thành viên',
  closed: 'Đã đóng',
};

export const JOIN_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

export const POST_TYPE_LABELS: Record<string, string> = {
  academic_update: 'Thông tin học vụ',
  event: 'Sự kiện',
};

export const ANNOUNCEMENT_SCOPE_LABELS: Record<string, string> = {
  global: 'Toàn hệ thống',
  course: 'Theo học phần',
};
