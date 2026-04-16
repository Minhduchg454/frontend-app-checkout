import { StrictDict } from "../../utils";

// Định nghĩa mã trạng thái khớp với CSDL
export const StatusOrder = StrictDict({
  PENDING: "pending", // Đang xử lý / Chờ thanh toán
  PAID: "paid", // Đã thanh toán
  COMPLETED: "completed", // Đã hoàn tất (thường dùng tương đương paid)
  FAILED: "failed", // Giao dịch thất bại
  CANCELLED: "cancelled", // Đã hủy
});

// (Tùy chọn) Định nghĩa nhãn hiển thị tiếng Việt và màu sắc tương ứng
export const StatusOrderMetadata = StrictDict({
  [StatusOrder.PENDING]: {
    label: "Đang xử lý",
    color: "#856404",
    bgColor: "#fff3cd",
  },
  [StatusOrder.PAID]: {
    label: "Thành công",
    color: "#155724",
    bgColor: "#d4edda",
  },
  [StatusOrder.COMPLETED]: {
    label: "Thành công",
    color: "#155724",
    bgColor: "#d4edda",
  },
  [StatusOrder.FAILED]: {
    label: "Thất bại",
    color: "#721c24",
    bgColor: "#f8d7da",
  },
  [StatusOrder.CANCELLED]: {
    label: "Đã hủy",
    color: "#6c757d",
    bgColor: "#e2e3e5",
  },
});
