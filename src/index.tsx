import "core-js/stable";
import "regenerator-runtime/runtime";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  APP_INIT_ERROR,
  APP_READY,
  subscribe,
  initialize,
  mergeConfig,
} from "@edx/frontend-platform";
import { Provider } from "react-redux";
import { AppProvider, ErrorPage } from "@edx/frontend-platform/react";
import App from "./App";
import { store } from "./store/redux";
import messages from "./i18n";

import "./index.css";

let root;

subscribe(APP_READY, () => {
  const queryClient = new QueryClient();
  const container = document.getElementById("root");
  if (!root) {
    root = createRoot(container);
  }

  root.render(
    <Provider store={store}>
      <AppProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AppProvider>
    </Provider>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  root.render(<ErrorPage message={error.message} />);
});

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
  requireAuthenticatedUser: true,
  hydrateAuthenticatedUser: true,
});
