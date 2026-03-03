import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  APP_INIT_ERROR,
  APP_READY,
  subscribe,
  initialize,
  mergeConfig,
} from "@edx/frontend-platform";
import { AppProvider, ErrorPage } from "@edx/frontend-platform/react";
import Header from "@edx/frontend-component-header";
import { FooterSlot } from "@edx/frontend-component-footer";

import messages from "./i18n";
import ExamplePage from "./example/ExamplePage";
import PaymentHistoryPage from "./payment-history/PaymentHistoryPage";

const queryClient = new QueryClient();
const container = document.getElementById("root");
const root = createRoot(container!);

// 1. Đăng ký render khi App đã sẵn sàng
subscribe(APP_READY, () => {
  root.render(
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/">
          <Header />
          <main style={{ minHeight: "80vh", padding: "20px" }}>
            <Routes>
              <Route
                path="/"
                element={
                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <h1>Chào Đức! Payment History MFE đang chạy</h1>
                    <p>
                      Truy cập <b>/orders</b> để xem nội dung chính.
                    </p>
                  </div>
                }
              />
              <Route path="/example" element={<ExamplePage />} />
              <Route path="/orders" element={<PaymentHistoryPage />} />
              <Route path="*" element={<div>404 - Không tìm thấy trang</div>} />
            </Routes>
          </main>
          <FooterSlot />
        </BrowserRouter>
      </QueryClientProvider>
    </AppProvider>,
  );
});

// 2. Đăng ký render lỗi nếu khởi tạo thất bại
subscribe(APP_INIT_ERROR, (error) => {
  root.render(<ErrorPage message={error.message} />);
});

// 3. Khởi tạo Application
initialize({
  messages,
  handlers: {
    config: () => {
      mergeConfig(
        {
          SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
          SUPPORT_URL: process.env.SUPPORT_URL,
          TERMS_OF_SERVICE_URL: process.env.TERMS_OF_SERVICE_URL,
          PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL,
          ENABLE_ACCESSIBILITY_PAGE:
            process.env.ENABLE_ACCESSIBILITY_PAGE === "true",
          SITE_NAME: process.env.SITE_NAME,
        },
        "Cấu hình hệ thống",
      );
    },
  },
  requireAuthenticatedUser: true, // Yêu cầu đăng nhập để tránh lỗi Header
  hydrateAuthenticatedUser: true,
});
