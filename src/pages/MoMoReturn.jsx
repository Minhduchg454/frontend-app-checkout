// pages/MoMoReturn.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyMoMoSignature } from "../data/services/payment_api/payment_momo";
import { simulateSuccess } from "../data/services/lms/api";
import { path } from "../utils/path";

export const MoMoReturn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleProcess = async () => {
      const params = Object.fromEntries(new URLSearchParams(location.search));
      const { orderId } = params;

      try {
        const isValid = verifyMoMoSignature(params);

        if (!isValid) {
          throw new Error("Chữ ký MoMo không hợp lệ!");
        }

        if (params.resultCode === "0") {
          await simulateSuccess(orderId);

          navigate(`${path.result}?orderId=${orderId}&status=success`, {
            replace: true,
          });
        } else {
          const message = params.message || "Giao dịch MoMo thất bại";
          navigate(
            `${path.result}?orderId=${orderId}&status=fail&message=${encodeURIComponent(message)}`,
            { replace: true },
          );
        }
      } catch (err) {
        console.error("MoMo Return Error:", err);
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
        Đang xác thực giao dịch với MoMo...
      </p>
    </div>
  );
};
