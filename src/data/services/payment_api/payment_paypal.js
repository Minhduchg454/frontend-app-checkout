import axios from "axios";
import { PAYPAL_CONFIG } from "../../../config/paymentProviderConfig";

// Hàm lấy Access Token từ PayPal (OAuth2)
async function getPayPalAccessToken() {
  const auth = btoa(
    `${PAYPAL_CONFIG.PAYPAL_CLIENT_ID}:${PAYPAL_CONFIG.PAYPAL_CLIENT_SECRET}`,
  );
  const res = await axios.post(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res.data.access_token;
}

export function convertToPaypalAmount(amount, currency) {
  if (currency?.toUpperCase() === "VND") {
    return (Number(amount) / 24000).toFixed(2);
  }
  return Number(amount).toFixed(2);
}

// Tạo đơn hàng PayPal
export const createPayPalOrder = async ({
  orderId,
  amount,
  currency,
  CLIENT_URL,
}) => {
  const accessToken = await getPayPalAccessToken();
  const paypalAmount = convertToPaypalAmount(amount, currency);

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        amount: {
          currency_code: "USD",
          value: paypalAmount,
        },
      },
    ],
    application_context: {
      return_url: `${CLIENT_URL}paypal_return`,
      cancel_url: `${window.location.origin}/checkout/result?orderId=${orderId}&status=fail`,
    },
  };

  const res = await axios.post(
    "https://api-m.sandbox.paypal.com/v2/checkout/orders",
    body,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const approveUrl = res.data.links.find((l) => l.rel === "approve").href;
  return { approveUrl };
};

// Capture (Xác nhận) thanh toán khi người dùng quay lại
export const capturePayPalOrder = async (token) => {
  const accessToken = await getPayPalAccessToken();
  const res = await axios.post(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  return res.data;
};
