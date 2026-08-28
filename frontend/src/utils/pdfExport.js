/* eslint-disable no-useless-escape */
function exportOrderToPDF(order, customerName, customerEmail) {
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow popups to download/print your PDF invoice.");
    return;
  }
  const itemsHtml = order.items.map(
    (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 13px; color: #1e293b; font-weight: 500;">
          ${item.productName}
          <div style="font-size: 11px; color: #64748b; font-family: monospace;">ID: ${item.productId}</div>
        </td>
        <td style="padding: 12px 8px; font-size: 13px; color: #334155; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; font-size: 13px; color: #334155; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px 8px; font-size: 13px; color: #0f172a; font-weight: 600; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
  ).join("");
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order.id} - VendoraShop</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { padding: 40px; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #2563eb; }
        .logo { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .logo span { color: #2563eb; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; margin-top: 6px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { background: #f1f5f9; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1; }
        .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
        .totals-row.grand-total { border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #0f172a; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Vendora<span>Shop</span></div>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Precision Hardware & Audio Acoustics</p>
          <div class="badge">Official Order Receipt</div>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">INVOICE</h2>
          <p style="font-family: monospace; font-size: 12px; color: #2563eb; font-weight: 600; margin-top: 2px;">#${order.id}</p>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Date: ${new Date(order.createdAt).toLocaleDateString(void 0, { month: "long", day: "numeric", year: "numeric" })}</p>
          <p style="color: #64748b; font-size: 12px;">Status: <strong style="color: #0f172a; text-transform: uppercase;">${order.status}</strong></p>
        </div>
      </div>

      <div class="grid-2">
        <div class="box">
          <h3>Customer Details</h3>
          <p style="font-weight: 600; color: #0f172a;">${customerName}</p>
          <p style="color: #475569;">${customerEmail}</p>
          <p style="color: #64748b; font-size: 11px; margin-top: 4px;">Payment: ${(order.paymentMethod || "Credit Card").toUpperCase()}</p>
        </div>

        <div class="box">
          <h3>Shipping Address</h3>
          <p style="color: #334155;">${order.shippingAddress.street}</p>
          <p style="color: #334155;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          ${order.trackingNumber ? `<p style="color: #2563eb; font-family: monospace; font-size: 11px; margin-top: 4px; font-weight: 600;">Tracking #: ${order.trackingNumber}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${Number(order.subtotal ?? order.subtotal_amount ?? 0).toFixed(2)}</span>
          </div>
          ${Number(order.discount ?? order.discount_amount ?? 0) > 0 ? `
          <div class="totals-row" style="color: #16a34a; font-weight: 600;">
            <span>Discount:</span>
            <span>-$${Number(order.discount ?? order.discount_amount ?? 0).toFixed(2)}</span>
          </div>` : ""}
          <div class="totals-row">
            <span>Shipping:</span>
            <span>${Number(order.shippingFee ?? order.shipping_amount ?? 0) === 0 ? "FREE" : `$${Number(order.shippingFee ?? order.shipping_amount ?? 0).toFixed(2)}`}</span>
          </div>
          <div class="totals-row">
            <span>Estimated Sales Tax:</span>
            <span>$${Number(order.tax ?? order.tax_amount ?? 0).toFixed(2)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Paid:</span>
            <span style="color: #2563eb;">$${Number(order.total ?? order.total_amount ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for choosing VendoraShop. All purchases are backed by our 30-Day Money-Back Guarantee.</p>
        <p style="margin-top: 4px;">For inquiries or warranty service, contact support@vendorashop.io \u2022 Generated on ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
function exportAllOrdersToPDF(orders, customerName, customerEmail) {
  const printWindow = window.open("", "_blank", "width=900,height=900");
  if (!printWindow) {
    alert("Please allow popups to download/print your Order History PDF.");
    return;
  }
  const ordersRows = orders.map(
    (order) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-family: monospace; font-weight: 600; color: #2563eb;">#${order.id}</td>
        <td style="padding: 10px 8px; color: #475569;">${new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString()}</td>
        <td style="padding: 10px 8px; color: #1e293b;">${(order.items || []).length} items (${(order.items || []).map((i) => i.productName || i.name).join(", ")})</td>
        <td style="padding: 10px 8px; text-transform: uppercase; font-size: 11px; font-weight: 700;">${order.status}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0f172a;">$${Number(order.total ?? order.total_amount ?? 0).toFixed(2)}</td>
      </tr>
    `
  ).join("");
  const totalSpent = (orders || []).reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0);
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Order History Report - VendoraShop</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { padding: 40px; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
        .logo { font-size: 22px; font-weight: 800; color: #0f172a; }
        .logo span { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { background: #f1f5f9; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; text-align: left; border-bottom: 1px solid #cbd5e1; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Vendora<span>Shop</span></div>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Customer Order History & Purchase Summary</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0f172a;">ACCOUNT STATEMENT</h2>
          <p style="color: #475569; font-size: 12px;">Customer: ${customerName} (${customerEmail})</p>
          <p style="color: #64748b; font-size: 11px;">Total Orders: ${orders.length} | Cumulative: $${totalSpent.toFixed(2)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Purchased Items</th>
            <th>Status</th>
            <th style="text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${ordersRows}
        </tbody>
      </table>

      <div style="margin-top: 24px; text-align: right;">
        <p style="font-size: 15px; font-weight: 800; color: #0f172a;">Cumulative Total: <span style="color: #2563eb;">$${totalSpent.toFixed(2)}</span></p>
      </div>

      <div class="footer">
        <p>VendoraShop Automated Financial & Order Report \u2022 Generated on ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
export {
  exportAllOrdersToPDF,
  exportOrderToPDF
};
