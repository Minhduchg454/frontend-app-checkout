import React from "react";
import { Helmet } from "react-helmet";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import { Modal } from "./components";
import {
  Checkout,
  ResultCheckout,
  TestPage,
  VNPayReturn,
  MoMoReturn,
  PayPalReturn,
} from "./pages";
import { path } from "./utils/path";
import { cuscLogoImgSrc } from "./payment-header/payment-header";

const App = () => {
  const cuscLogo = cuscLogoImgSrc();
  const { isShowModal, modalChildren } = useSelector((state) => state.app);

  return (
    <>
      <Helmet>
        <title>Thanh toán</title>
        <link rel="shortcut icon" href={cuscLogo} type="image/x-icon" />
      </Helmet>
      <div className="app-container">
        {isShowModal && <Modal>{modalChildren}</Modal>}
        <Routes>
          <Route path={path.checkout} element={<Checkout />} />
          <Route path={path.result} element={<ResultCheckout />} />
          <Route path={path.test} element={<TestPage />} />
          <Route path={path.vnpayReturn} element={<VNPayReturn />} />
          <Route path={path.momoReturn} element={<MoMoReturn />} />
          <Route path={path.paypalReturn} element={<PayPalReturn />} />
          <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
        </Routes>
      </div>
    </>
  );
};

export default App;
