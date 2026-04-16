import vnpayIcon from "../assets/images/VNPay-active.png";
import momoIcon from "../assets/images/MoMo-active.png";
import paypalIcon from "../assets/images/paypal_active.png";
import visaIcon from "../assets/images/logo-visa.png";
import mastercardIcon from "../assets/images/logo-mastercard.svg";
import agribankIcon from "../assets/images/logo-agribank.png";
import hdbankIcon from "../assets/images/logo-hdbank.png";
import sacombankIcon from "../assets/images/logo-sacombank.png";
import bidvIcon from "../assets/images/logo-bidv.png";
import vietinbankIcon from "../assets/images/logo-vietinbank.png";

export const PAYMENT_CONFIG = {
  wallet: {
    id: "wallet",
    label: "Ví điện tử",
    active: true,
    details: [
      {
        id: "vnpay",
        label: "VNPay",
        icon: vnpayIcon,
        active: true,
      },
      {
        id: "momo",
        label: "MoMo",
        icon: momoIcon,
        active: true,
      },
      {
        id: "paypal",
        label: "PayPal",
        icon: paypalIcon,
        active: true,
      },
    ],
  },

  international: {
    id: "international",
    label: "Thanh toán thẻ tín dụng",
    active: true,
    details: [
      {
        id: "visa",
        label: "Thẻ Visa",
        icon: visaIcon,
        active: true,
      },
      {
        id: "mastercard",
        label: "Mastercard",
        icon: mastercardIcon,
        active: true,
      },
    ],
  },

  bank_transfer: {
    id: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
    active: true,
    details: [
      {
        id: "agribank",
        label: "Agribank",
        icon: agribankIcon,
        active: true,
      },
      {
        id: "hdbank",
        label: "HDBank",
        icon: hdbankIcon,
        active: true,
      },
      {
        id: "sacombank",
        label: "Sacombank",
        icon: sacombankIcon,
        active: true,
      },
      {
        id: "bidv",
        label: "BIDV",
        icon: bidvIcon,
        active: true,
      },
      {
        id: "vietinbank",
        label: "VietinBank",
        icon: vietinbankIcon,
        active: true,
      },
    ],
  },
};
