const CLIENT_URL = "http://apps.local.openedx.io:2002/checkout";

export const VNPAY_CONFIG = {
  tmnCode: "DCHLM17U",
  hashSecret: "YPT7V7L5PO1GIOEXTYWPMP46RQPUQ4RC",
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: `${CLIENT_URL}/vnpay_return/`,
  ipnUrl: `${CLIENT_URL}/vnpay_ipn/`,
};

export const MOMO_CONFIG = {
  endpoint:
    "https://cors-anywhere.herokuapp.com/https://test-payment.momo.vn/v2/gateway/api/create",
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  redirectUrl: `${CLIENT_URL}/momo_return/`,
  ipnUrl: `${CLIENT_URL}/momo_ipn/`,
};

export const PAYPAL_CONFIG = {
  PAYPAL_CLIENT_ID:
    "AcUfmemTk3ilTD6W-LY7kb4i3akdHiNsWatDKdwpx6RzS6vUWj1Wt0P_2p7AXPVSRjh8T0aLprDsaEhS",
  PAYPAL_CLIENT_SECRET:
    "EMnBmO7I23OkurJLjsMksu1jPgC08bRmgOYs9kjfBXD3rzU3ExpfRyd8hQinbA4SgaOYWreo58tlRE8E",
  return_url: `${CLIENT_URL}/paypal_return`,
};
