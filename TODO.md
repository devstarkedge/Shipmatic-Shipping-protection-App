# TODO for Order Expiration Implementation

## Steps from Approved Plan

1. **[x] Update loader in app/routes/app.order._index.jsx**:
   - Include `claimPortalSettings` in the returned `json` object to pass `days` to the frontend.

2. **[x] Update component in app/routes/app.order._index.jsx**:
   - Destructure `claimPortalSettings` from `useLoaderData()`.
   - In the `rows` mapping for the Action column (no-claim case):
     - Compute expiration date: `new Date(order.createdAt).getTime() + parseInt(days) * 86400000 < Date.now()`.
     - If expired, show `<span style={{ color: "#666", fontStyle: "italic" }}>Order is expired</span>`.
     - Else, keep "File claim" button.

3. **Followup**:
   - [x] Verify changes.
   - Test: Set days=1, check UI for old orders.

Status: Complete
