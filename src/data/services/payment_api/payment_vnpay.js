import moment from "moment";
import qs from "qs";
import CryptoJS from "crypto-js";
import { VNPAY_CONFIG } from "../../../config/paymentProviderConfig";

function sortObject(obj) {
  const sorted = {};
  const keys = [];
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      keys.push(encodeURIComponent(k));
    }
  }
  keys.sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = encodeURIComponent(obj[keys[i]]).replace(/%20/g, "+");
  }
  return sorted;
}

export const createPaymentVNpay = async (body, ipAddr) => {
  const { amount, bankCode, orderInfo, returnPath, orderId, CLIENT_URL } = body;

  if (!amount || isNaN(amount)) {
    const err = new Error("Thiếu hoặc sai định dạng amount");
    err.status = 400;
    throw err;
  }

  const { tmnCode, hashSecret, url } = VNPAY_CONFIG;

  const createDate = moment().format("YYYYMMDDHHmmss");

  const urlObj = new URL(`${CLIENT_URL}vnpay_return/`);
  const ipnObj = new URL(`${CLIENT_URL}vnpay_ipn/`);

  if (returnPath) {
    urlObj.searchParams.set("returnPath", returnPath);
  }

  const info = orderInfo || `Thanh toan cho ma GD:${orderId}`;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: info,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: urlObj.toString(),
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  };
  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });

  const signed = CryptoJS.HmacSHA512(signData, hashSecret).toString(
    CryptoJS.enc.Hex,
  );

  vnp_Params.vnp_SecureHash = signed;

  const paymentUrl = `${url}?${qs.stringify(vnp_Params, { encode: false })}`;

  return {
    success: true,
    message: "OK",
    paymentUrl,
    orderId,
  };
};

export const verifyVNPayChecksum = async (query) => {
  const vnp_Params = {};
  Object.keys(query).forEach((key) => {
    if (key.startsWith("vnp_")) {
      vnp_Params[key] = query[key];
    }
  });

  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const sorted = sortObject(vnp_Params);

  const signData = qs.stringify(sorted, { encode: false });
  const { hashSecret } = VNPAY_CONFIG;

  const signed = CryptoJS.HmacSHA512(signData, hashSecret).toString(
    CryptoJS.enc.Hex,
  );

  return { isValid: secureHash === signed, data: sorted };
};
