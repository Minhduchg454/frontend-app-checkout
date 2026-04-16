// pages/VNPayReturn.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyVNPayChecksum } from "../data/services/payment_api/payment_vnpay";
import { simulateSuccess } from "../data/services/lms/api";
import { path } from "../utils/path";

export const VNPayReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleProcess = async () => {
      const params = Object.fromEntries(new URLSearchParams(location.search));
      const orderId = params.vnp_TxnRef;

      try {
        const { isValid, data } = await verifyVNPayChecksum(params);

        if (!isValid) {
          throw new Error("Chữ ký thanh toán không hợp lệ!");
        }

        if (data.vnp_ResponseCode === "00") {
          await simulateSuccess(orderId);

          navigate(`${path.result}?orderId=${orderId}&status=success`, {
            replace: true,
          });
        } else {
          navigate(
            `${path.result}?orderId=${orderId}&status=fail&message=Giao dịch đã bị hủy hoặc gặp lỗi`,
            { replace: true },
          );
        }
      } catch (err) {
        console.error("VNPay Return Error:", err);
        navigate(
          `${path.result}?status=fail&message=${encodeURIComponent(err.message)}`,
          { replace: true },
        );
      }
    };

    handleProcess();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cusc_blue" />
      <p className="mt-4 text-gray-600 font-medium">
        Đang xác thực giao dịch với VNPay...
      </p>
    </div>
  );
};
