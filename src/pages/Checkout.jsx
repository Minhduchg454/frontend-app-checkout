import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line import/no-extraneous-dependencies
import { useDispatch } from "react-redux";

import {
  fetchCheckoutData,
  createOrder,
  simulateSuccess,
} from "../data/services/lms/api";
import { createPaymentVNpay } from "../data/services/payment_api/payment_vnpay";
import { createMoMoPayment } from "../data/services/payment_api/payment_momo";
import { createPayPalOrder } from "../data/services/payment_api/payment_paypal";
import noImage from "../assets/images/no_image.jpg";

import {
  Header,
  SelectableCardList,
  BankTransferQr,
  Loading,
} from "../components";
import { path } from "../utils/path";
import { showModal, hideModal } from "../store/app/appSlice";
import { PAYMENT_CONFIG } from "../config/paymentConfig";
import { getPaymentCheckoutUrl, getApiUrl } from "../data/services/lms/urls";

// test moi truong
// http://apps.local.openedx.io:2002/checkout/?course_id=course-v1%3AHoiDanIT%2BY0001%2B2025_T2&user=minhduchg454&next=http%3A%2F%2Flocal.openedx.io%3A8000%2Fcourses%2Fcourse-v1%3AHoiDanIT%2BY0001%2B2025_T2%2Fabout

/**
 * Mẫu test vnpay
 * ngan hang: NCB
 * so the: 9704198526191432198
 * ten chu the: NGUYEN VAN A
 * ngay phat hanh: 07/15
 * opt: 123456
 */

/**
 * Mau test Paypal
 * email: sb-2lybe49137294@personal.example.com
 * mk: bQ_4UnAF
 */

/**
 * Mau test Momo qua the ngan hang
 * So the:9704 0000 0000 0018
 * Chu the:NGUYEN VAN A
 * Ngay tao: 03/07
 * otp: OTP
 */

export const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("wallet");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [paymentLocked, setPaymentLocked] = useState(false);

  const paymentMethods = Object.values(PAYMENT_CONFIG).filter(
    (method) => method.active,
  );

  const currentPaymentDetails = (
    PAYMENT_CONFIG[selectedMethod]?.details || []
  ).filter((detail) => detail.active);

  const buildPaymentMethodLabel = () => {
    const method = PAYMENT_CONFIG[selectedMethod];
    if (!method) {
      return "";
    }
    const detail = method.details.find((d) => d.id === paymentDetail);
    if (!detail) {
      return method.label;
    }
    return `${method.label} - ${detail.label}`;
  };

  useEffect(() => {
    sessionStorage.removeItem("payment_locked");
    sessionStorage.removeItem("payment_order_id");
    fetchCheckoutData()
      .then((res) => {
        setData(res);
        sessionStorage.setItem("checkout_next", res.nextUrl);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Lỗi tải dữ liệu");
        setLoading(false);
      });
  }, []);

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
    const activeDetails =
      PAYMENT_CONFIG[methodId]?.details.filter((d) => d.active) || [];
    setPaymentDetail(activeDetails[0]?.id || "");
  };

  if (loading) {
    return <div className="p-8">Đang tải dữ liệu thanh toán...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Lỗi: {error}</div>;
  }

  const { course, pricing, username, nextUrl, lmsBase } = data;

  const handlePay = async () => {
    const CLIENT_URL = getPaymentCheckoutUrl();

    if (!paymentDetail) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    try {
      dispatch(showModal(<Loading />));
      const order = await createOrder({
        courseId: course.course_id,
        username,
        amount: pricing.price,
        currency: pricing.currency,
        courseName: course.display_name,
        paymentMethod: {
          channel: selectedMethod,
          provider: paymentDetail,
          label: buildPaymentMethodLabel(),
        },
        nextUrl,
      });

      setPaymentLocked(true);

      sessionStorage.setItem("payment_order_id", order.id);
      sessionStorage.setItem("payment_locked", "1");

      let clientIp = "127.0.0.1";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip;
      } catch (e) {
        console.warn("Không lấy được IP, dùng default 127.0.0.1");
      }

      switch (paymentDetail) {
        case "vnpay": {
          const payResult = await createPaymentVNpay(
            {
              orderId: order.id,
              amount: pricing.price,
              bankCode: "NCB",
              CLIENT_URL,
            },
            clientIp,
          );

          dispatch(hideModal());
          if (payResult.success && payResult.paymentUrl) {
            window.location.href = payResult.paymentUrl;
          } else {
            throw new Error("Không tạo được URL thanh toán VNPay");
          }
          return;
        }
        case "momo": {
          const momoData = await createMoMoPayment({
            orderId: order.id,
            amount: pricing.price,
            orderInfo: `Thanh toán khóa học: ${course.display_name}`,
            CLIENT_URL,
          });

          dispatch(hideModal());

          const redirect =
            momoData.payUrl || momoData.deeplink || momoData.qrCodeUrl;

          if (redirect) {
            window.location.href = redirect;
          } else {
            throw new Error("MoMo không trả về URL thanh toán");
          }
          return;
        }
        case "paypal": {
          const { approveUrl } = await createPayPalOrder({
            orderId: order.id,
            amount: pricing.price,
            currency: pricing.currency,
            CLIENT_URL,
          });

          dispatch(hideModal());
          window.location.href = approveUrl;
          return;
        }

        case "sacombank":
        case "hdbank":
        case "agribank":
        case "bidv":
        case "vietinbank": {
          dispatch(hideModal());
          const bank = order.extra_data?.bank_transfer;
          if (!bank) {
            throw new Error("Không có thông tin chuyển khoản");
          }
          dispatch(
            showModal(
              <BankTransferQr
                bankCode={bank.bankCode}
                bankName={bank.bankName}
                accountNumber={bank.accountNumber}
                accountName={bank.accountName}
                amount={pricing.price}
                orderId={`${username.toUpperCase()} HD${order.id}`}
                onConfirm={() => {
                  dispatch(hideModal());
                  navigate(
                    `${path.result}?orderId=${order.id}&status=processing`,
                    { replace: true },
                  );
                }}
                onCancel={() => {
                  setPaymentLocked(false);
                  dispatch(hideModal());
                }}
              />,
            ),
          );
          return;
        }
        case "visa": {
          await simulateSuccess(order.id);
          dispatch(hideModal());
          navigate(`${path.result}?orderId=${order.id}&status=success`, {
            replace: true,
          });
          return;
        }
        case "mastercard": {
          await simulateSuccess(order.id);
          dispatch(hideModal());
          navigate(`${path.result}?orderId=${order.id}&status=success`, {
            replace: true,
          });
          return;
        }
        default: {
          throw new Error("Phương thức thanh toán không được hỗ trợ");
        }
      }
    } catch (err) {
      const msg =
        err?.message || "Không thể tạo đơn hàng hoặc khởi tạo thanh toán";
      dispatch(hideModal());
      navigate(
        `${path.result}?status=fail&message=${encodeURIComponent(msg)}`,
        {
          replace: true,
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ===== HEADER ===== */}
      <Header urlExit={nextUrl} />

      {/* ===== MAIN ===== */}
      <main className="flex-1 mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* LEFT: PAYMENT */}
          <section className="md:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold mb-4">
              Chọn phương thức thanh toán
            </h2>

            <div className="text-sm flex justify-start items-center gap-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`border p-2 rounded-xl flex items-center gap-2 ${
                    selectedMethod === method.id ? "border-cusc_blue" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    disabled={paymentLocked}
                    onChange={() => handleSelectMethod(method.id)}
                  />

                  {method.label}
                </label>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-4">
                Lựa chọn phương thức thanh toán
              </h2>

              <SelectableCardList
                disabled={paymentLocked}
                items={currentPaymentDetails}
                value={paymentDetail}
                onChange={setPaymentDetail}
              />
            </div>
          </section>

          {/* RIGHT: ORDER INFO */}
          <section className="bg-white rounded-xl shadow p-6 ">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>

            {/* COURSE PREVIEW */}
            <div className="mb-4">
              <img
                src={
                  course.image_url
                    ? `${lmsBase}${course.image_url}`
                    : { noImage }
                }
                alt={course.display_name}
                className="w-full h-40 object-cover rounded"
              />

              <div className="mt-3 font-medium">{course.display_name}</div>
            </div>

            <hr className="my-4" />

            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Học viên</dt>
                <dd className="font-medium">{username}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-gray-600">Hình thức</dt>
                <dd className="font-medium">
                  {pricing.mode_display_name || "Không xác định"}
                </dd>
              </div>
            </dl>

            <hr className="my-4" />

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Tổng tiền</span>
              <span className="text-green-600">
                {Number(pricing.price).toLocaleString("vi-VN")}{" "}
                {pricing.currency}
              </span>
            </div>

            <hr className="my-4" />

            <div className="flex justify-end">
              <button
                onClick={handlePay}
                disabled={paymentLocked}
                className={` px-2 py-1 rounded-lg font-bold text-white ${
                  paymentLocked
                    ? "bg-gray-400"
                    : "bg-cusc_blue hover:bg-blue-700"
                }`}
              >
                {paymentLocked ? "Đang xử lý..." : "Thanh toán"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
