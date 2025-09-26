import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port:  587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, 
  },
});

export async function sendClaimSubmittedEmail({
  to,
  claimId,
  orderId,
  items,
  method,
  senderName,
  senderEmail,
  replyEmail,
}) {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td>${item.itemId}</td>
          <td>${item.quantity}</td>
          <td>${item.reasons.join(', ')}</td>
          <td>${item.notes || 'N/A'}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Claim Submitted Successfully</h2>
      <p>Dear Customer,</p>
      <p>Your claim has been submitted successfully. Here are the details:</p>
      <p><strong>Claim ID:</strong> ${claimId}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Resolution Method:</strong> ${method}</p>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>Item ID</th>
            <th>Quantity</th>
            <th>Reasons</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p>We will review your claim and get back to you soon.</p>
      <p>If you have any questions, please contact us at ${replyEmail}.</p>
      <p>Best regards,<br>${senderName}</p>
    </div>
  `;

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject: 'Claim Submitted - Order ' + orderId,
    html,
    replyTo: replyEmail,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
