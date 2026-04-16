import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { capturePayPalOrder } from "../data/services/payment_api/payment_paypal";
import { simulateSuccess } from "../data/services/lms/api";
import { path } from "../utils/path";

export const PayPalReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const processing = useRef(false);

  useEffect(() => {
    const handleProcess = async () => {
      if (processing.current) {
        return;
      }

      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) {
        navigate(
          `${path.result}?status=fail&message=Thiếu mã xác thực PayPal`,
          { replace: true },
        );
        return;
      }

      try {
        processing.current = true;

        const captureData = await capturePayPalOrder(token);

        const orderId = captureData.purchase_units[0].reference_id;

        if (captureData.status === "COMPLETED") {
          await simulateSuccess(orderId);

          navigate(`${path.result}?orderId=${orderId}&status=success`, {
            replace: true,
          });
        } else {
          throw new Error(
            `Giao dịch chưa hoàn tất (Trạng thái: ${captureData.status})`,
          );
        }
      } catch (err) {
        console.error("PayPal Capture Error:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Lỗi xác nhận thanh toán PayPal";
        navigate(
          `${path.result}?status=fail&message=${encodeURIComponent(errorMsg)}`,
          { replace: true },
        );
      }
    };

    handleProcess();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cusc_blue" />
      <p className="mt-4 text-gray-600 font-medium">
        Đang hoàn tất thanh toán với PayPal...
      </p>
    </div>
  );
};
