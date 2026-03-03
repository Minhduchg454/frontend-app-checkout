// src/payment-history/PaymentHistoryPage.jsx  (hoặc .tsx vẫn OK, nhưng không cần type)
const PaymentHistoryPage = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Lịch sử thanh toán</h2>
      <p>
        Đây là trang custom của bạn. Sau này fetch data từ Ecommerce API ở đây
        nhé!
      </p>

      {/* Placeholder cho sau này */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <p style={{ color: "#6c757d" }}>
          Hiện tại chưa có đơn hàng nào trong lịch sử thanh toán.
        </p>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
