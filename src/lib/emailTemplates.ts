// Email template for payment receipts
export function generateReceiptEmail(
  userName: string,
  amount: number,
  currency: string,
  invoiceUrl: string | null,
  subscriptionType: string,
  startDate: string | Date,
  endDate: string | Date
) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);

  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - PREMIUM</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090B; color: #FAFAFA;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0C0C0E 100%); border: 1px solid #333; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000; font-size: 18px;">P</div>
        <div>
          <h1 style="margin: 0; font-size: 20px; color: #FAFAFA;">PREMIUM</h1>
          <p style="margin: 0; font-size: 12px; color: #9CA3AF;">Premium Subscription Service</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 24px 0; border-top: 1px solid #333; border-bottom: 1px solid #333;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #9CA3AF;">Payment Receipt</p>
        <h2 style="margin: 0; font-size: 32px; color: #FBBF24; font-weight: bold;">${formattedAmount}</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #9CA3AF;">${formattedStartDate}</p>
      </div>
    </div>

    <!-- Receipt Details -->
    <div style="background: #0C0C0E; border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 20px 0; font-size: 16px; color: #FAFAFA; font-weight: 600;">Receipt Details</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF;">Customer</p>
          <p style="margin: 0; font-size: 14px; color: #FAFAFA;">${userName || 'Customer'}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF;">Subscription Type</p>
          <p style="margin: 0; font-size: 14px; color: #FAFAFA;">${subscriptionType || 'Premium'}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF;">Start Date</p>
          <p style="margin: 0; font-size: 14px; color: #FAFAFA;">${formattedStartDate}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF;">End Date</p>
          <p style="margin: 0; font-size: 14px; color: #FAFAFA;">${formattedEndDate}</p>
        </div>
      </div>
    </div>

    <!-- Benefits -->
    <div style="background: #0C0C0E; border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #FAFAFA; font-weight: 600;">Your Premium Benefits</h3>
      <ul style="margin: 0; padding: 0; list-style: none;">
        <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="width: 20px; height: 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6L5 8L9 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span style="font-size: 14px; color: #FAFAFA;">Zero Ads Experience</span>
        </li>
        <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="width: 20px; height: 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6L5 8L9 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span style="font-size: 14px; color: #FAFAFA;">Premium Features</span>
        </li>
        <li style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 20px; height: 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6L5 8L9 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span style="font-size: 14px; color: #FAFAFA;">Priority Support</span>
        </li>
      </ul>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${invoiceUrl || '#'}" style="display: inline-block; background: #FBBF24; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Full Receipt</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #9CA3AF;">Need help? Contact our support team</p>
      <p style="margin: 0; font-size: 12px; color: #6B7280;">PREMIUM Subscription Service</p>
    </div>
  </div>
</body>
</html>
  `;
}
