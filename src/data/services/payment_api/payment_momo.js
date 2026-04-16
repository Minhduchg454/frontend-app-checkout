import CryptoJS from "crypto-js";
import axios from "axios";
import { MOMO_CONFIG } from "../../../config/paymentProviderConfig";

function signSHA256(rawSignature, secretKey) {
  return CryptoJS.HmacSHA256(rawSignature, secretKey).toString(
    CryptoJS.enc.Hex,
  );
}

function buildCreateRawSignature({
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  partnerCode,
  redirectUrl,
  requestId,
  requestType,
}) {
  return (
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`
  );
}

export const createMoMoPayment = async ({ orderId, amount, orderInfo }) => {
  const { endpoint, partnerCode, accessKey, secretKey, redirectUrl, ipnUrl } =
    MOMO_CONFIG;

  const requestId = orderId;
  const requestType = "payWithMethod";
  const extraData = "";
  const autoCapture = true;
  const lang = "vi";

  const rawSignature = buildCreateRawSignature({
    accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode,
    redirectUrl,
    requestId,
    requestType,
  });

  const signature = signSHA256(rawSignature, secretKey);

  const requestBody = {
    partnerCode,
    partnerName: "CUSC Test",
    storeId: "CUSCStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture,
    extraData,
    signature,
  };

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { data } = response;

    if (data.resultCode !== 0) {
      throw new Error(data.message || "MoMo create failed");
    }

    return data;
  } catch (error) {
    console.error(
      "Lỗi tạo thanh toán MoMo:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * Xây dựng chuỗi raw signature để kiểm tra kết quả trả về
 */
function buildVerifyRawSignature(query, accessKey) {
  const {
    amount,
    extraData = "",
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
  } = query;

  return (
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`
  );
}

export const verifyMoMoSignature = (query) => {
  if (!query.signature) {
    return false;
  }

  const { accessKey, secretKey } = MOMO_CONFIG;
  const rawSignature = buildVerifyRawSignature(query, accessKey);
  const expectedSignature = signSHA256(rawSignature, secretKey);

  return query.signature === expectedSignature;
};
