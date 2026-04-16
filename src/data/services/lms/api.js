import { getConfig } from "@edx/frontend-platform";
import { get, post, stringifyUrl } from "./utils";
import urls from "./urls";

const bankConfigs = require("../../../config/bank.json");

// Lấy dữ liệu khởi tạo cho Learner Home Dashboard
export const initializeList = ({ user } = {}) =>
  get(stringifyUrl(urls.getInitApiUrl(), { user }));

// Ghi lại các sự kiện tracking người dùng
export const logEvent = ({ eventName, data, courseId }) =>
  post(urls.event(), {
    courserun_key: courseId,
    event_type: eventName,
    page: window.location.href,
    event: JSON.stringify(data),
  });

/**
 * Tra cứu thông tin User theo username
 * Tương ứng bảng: AUTH_USER
 */
export const lookupUser = async (username) => {
  if (!username) {
    throw new Error("Thiếu username để tra cứu user");
  }
  const response = await get(urls.userLookupUrl(username));
  const { data } = response;
  if (!data.count || data.count < 1) {
    throw new Error(`Không tìm thấy user "${username}"`);
  }
  return data.results[0];
};

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại
 * Tương ứng bảng: CUSC_ECOMMERCE_ORDER
 */
export const fetchUserOrders = () => get(urls.getOrdersUrl());

/**
 * Lấy chi tiết một đơn hàng cụ thể
 */
export const fetchOrderDetail = (orderId) => {
  if (!orderId) {
    throw new Error("Thiếu orderId");
  }
  return get(urls.getOrderDetailUrl(orderId)).then((res) => res.data);
};

/**
 * Lấy thông tin giá và các chế độ học (modes) của khóa học
 * Tương ứng bảng: COURSE_MODES_COURSEMODE
 */
export const fetchCoursePricing = async (courseId, mode) => {
  const response = await get(urls.coursePricingUrl(courseId));
  const { data } = response;

  // Logic tìm mode phù hợp (ưu tiên 'verified' nếu không truyền mode cụ thể)
  const chosen = mode
    ? data.modes.find((m) => m.mode_slug === mode)
    : data.modes.find((m) => m.mode_slug === "verified") || data.modes[0];

  return {
    courseId: data.course_id,
    mode: chosen.mode_slug,
    price: chosen.price,
    currency: chosen.currency,
    mode_display_name: chosen.mode_display_name,
    raw: chosen,
  };
};

/**
 * Lấy thông tin chi tiết khóa học (mô tả, ảnh, tiêu đề)
 * Tương ứng bảng: COURSE_OVERVIEWS_COURSEOVERVIEW
 */
export const fetchCourseDetail = (courseId) =>
  get(urls.courseDetailUrl(courseId)).then((res) => res.data);

// api.js

export const fetchCheckoutData = async () => {
  // 1. Lấy params từ URL
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("course_id");
  const username = params.get("user");
  const nextUrl = params.get("next");

  if (!courseId || !username) {
    throw new Error("Thiếu thông tin khóa học hoặc người dùng trên URL");
  }

  try {
    // 2. Sử dụng Promise.all để gọi các hàm get() đã được bao bọc bên trên
    // Việc này đảm bảo các hàm này tự đính kèm Token/Header cần thiết
    const [user, pricing, course] = await Promise.all([
      lookupUser(username),
      fetchCoursePricing(courseId),
      fetchCourseDetail(courseId),
    ]);

    // 3. Trả về cấu trúc tương thích với Frontend
    return {
      courseId,
      username,
      user,
      pricing,
      course,
      nextUrl: nextUrl || "/",
      lmsBase: getConfig().LMS_BASE_URL,
    };
  } catch (err) {
    console.error("Lỗi khi tổng hợp dữ liệu Checkout:", err);
    throw err;
  }
};

/**
 * Tạo đơn hàng mới trong hệ thống LMS
 * Tương ứng logic: router.post("/api/orders/create") của Node.js
 */
export const createOrder = async (orderPayload) => {
  const {
    courseId,
    username,
    amount,
    currency,
    nextUrl,
    paymentMethod,
    courseName,
  } = orderPayload;

  // 1. Kiểm tra dữ liệu đầu vào (Y hệt router.js cũ)
  if (!courseId || !username || !amount) {
    throw new Error("Thiếu dữ liệu tạo order");
  }
  if (!paymentMethod || !paymentMethod.provider) {
    throw new Error("Thiếu paymentMethod");
  }

  // Xác định trạng thái chờ thanh toán
  const pendingProviders = ["atm", "bank_transfer"];
  const isPendingPayment = pendingProviders.includes(paymentMethod.channel);

  try {
    // 2. Xử lý thông tin ngân hàng (Logic bank_transfer cũ)
    let selectedBankInfo = null;
    if (paymentMethod.channel === "bank_transfer") {
      selectedBankInfo = bankConfigs[paymentMethod.provider];

      if (!selectedBankInfo) {
        throw new Error(
          `Không tìm thấy cấu hình cho ngân hàng: ${paymentMethod.provider}`,
        );
      }
    }

    // 3. Tra cứu User để lấy ID và Email (lmsApi.lookupUser)
    const user = await lookupUser(username);

    // 4. Gọi API tạo Order trong LMS (lmsApi.createOrderInLms)
    const body = {
      course_id: courseId,
      amount,
      currency,
      external_order_id: `MFE-PAY-${Date.now()}`,
      username,
      userId: user.id,
      extra_data: {
        source: "mfe-checkout",
        next: nextUrl,
        course_name: courseName,
        payment_method: {
          channel: paymentMethod.channel,
          provider: paymentMethod.provider,
          label: paymentMethod.label,
        },
        bank_transfer: selectedBankInfo,
      },
    };

    const response = await post(urls.createOrderUrl(), body);
    const order = response.data;

    // 5. Gửi mail khi trạng thái là pending (Logic try/catch mail cũ)
    try {
      if (isPendingPayment) {
        await post(urls.sendMailUrl(), {
          to: [user.email],
          subject: "Đã ghi nhận đơn hàng – chờ xác nhận chuyển khoản",
          template: "emails/order_pending.html",
          context: {
            name: user.username,
            order_id: order.id,
            course_name: courseName,
            amount: Number(amount).toLocaleString("vi-VN"),
            currency: currency || "VND",
            payment_method_label: paymentMethod.label,
            course_createdAt: order.created_at
              ? new Date(order.created_at).toLocaleString("vi-VN")
              : "",
          },
        });
      }
    } catch (mailErr) {
      console.error("Lỗi gửi mail:", mailErr.message);
    }
    return order;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const simulateSuccess = async (orderId) => {
  if (!orderId) {
    throw new Error("Thiếu orderId");
  }

  try {
    // Gọi endpoint cập nhật trạng thái đơn hàng thành 'paid'
    const response = await post(urls.simulateSuccessUrl(orderId), {
      status: "paid",
      payment_info: {
        gateway: "simulate",
        note: "Thanh toán giả lập từ MFE",
      },
    });

    const order = response.data;
    if (order.status === "paid") {
      await sendMailAfterSuccess(order);
    }

    return { ok: true, data: order };
  } catch (err) {
    console.error("Simulate success failed:", err);
    throw err;
  }
};

/**
 * 2. Hàm hỗ trợ gửi mail sau khi thành công (Tái hiện lại helper.js)
 */
const sendMailAfterSuccess = async (order) => {
  const course = await get(urls.courseDetailUrl(order.course_id)).then(
    (res) => res.data,
  );

  const mailPayload = {
    to: [order.email || order.user_email],
    subject: "Thanh toán thành công – bắt đầu học ngay",
    template: "emails/order_success.html",
    context: {
      name: order.username,
      order_id: order.id,
      course_name: course.display_name,
      amount: Number(order.amount).toLocaleString("vi-VN"),
      currency: order.currency,
      payment_method_label:
        order.extra_data?.payment_method?.label || "Giả lập",
      result_url: order.extra_data?.next || "/",
      course_createdAt: new Date().toLocaleString("vi-VN"),
    },
  };

  return post(urls.sendMailUrl(), mailPayload);
};

export const fetchOrderResult = async (orderId) => {
  const order = await get(urls.getOrderDetailUrl(orderId)).then(
    (res) => res.data,
  );
  const course = await get(urls.courseDetailUrl(order.course_id)).then(
    (res) => res.data,
  );

  return {
    status: order.status === "paid" ? "success" : "fail",
    orderId: order.id,
    user: order.username,
    amount: Number(order.amount),
    currency: order.currency.toUpperCase(),
    paymentMethod: {
      channel: order.extra_data?.payment_method?.channel,
      provider: order.extra_data?.payment_method?.provider,
      label:
        order.extra_data?.payment_method?.label ||
        order.extra_data?.payment_info?.gateway ||
        "Không xác định",
    },
    paidAt: order.updated_at,
    course: {
      name: course.display_name,
      url: order.extra_data?.next,
    },
  };
};

export const apiCreateVNPayPayment = async (data) => {
  // Gửi y hệt body từ frontend cũ lên endpoint Django mới
  const response = await post(urls.vnpayCreateUrl(), data);
  if (response.data && response.data.paymentUrl) {
    window.location.href = response.data.paymentUrl;
  }
  return response.data;
};

/**
 * 4. Tạo thanh toán PayPal
 * Tương ứng logic: router.post("/api/paypal/create-order")
 */
export const apiCreatePaypalPayment = async (data) => {
  const response = await post(urls.paypalCreateUrl(), data);
  if (response.data && response.data.approveUrl) {
    window.location.href = response.data.approveUrl;
  }
  return response.data;
};

/**
 * 5. Tạo thanh toán MoMo
 * Tương ứng logic: router.post("/api/momo/create-payment")
 */
export const apiCreateMoMoPayment = async (data) => {
  const response = await post(urls.momoCreateUrl(), data);
  if (response.data && response.data.redirectUrl) {
    window.location.href = response.data.redirectUrl;
  }
  return response.data;
};

export default {
  initializeList,
  logEvent,
  lookupUser,
  fetchUserOrders,
  fetchOrderDetail,
  fetchCoursePricing,
  fetchCourseDetail,
  fetchCheckoutData,
  createOrder,
  simulateSuccess,
  fetchOrderResult,
};
