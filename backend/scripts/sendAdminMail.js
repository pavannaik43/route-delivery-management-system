require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mailService = require('../src/services/mailService');

async function run() {
  console.log('====================================================');
  console.log(' Hatsun RDMS — Mail Service Dispatch Initializer   ');
  console.log('====================================================');

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hatsun.com';
    console.log(`[Mail Service] Initiating mail dispatch to: ${adminEmail}`);

    const mailData = {
      subject: 'Hatsun RDMS Operational Mail Service Active',
      title: 'Hatsun RDMS Mail Service Online & Initialized',
      message: `
        <p>Dear Administrator,</p>
        <p>
          The <strong>Hatsun Agro Products Route Delivery Management System (RDMS)</strong> automated mail service has been successfully initialized and connected.
        </p>
        <p>
          This service is now configured to automatically deliver:
        </p>
        <ul style="padding-left: 20px; margin: 12px 0;">
          <li>Daily route delivery and revenue reconciliation reports</li>
          <li>Real-time low vehicle stock notifications</li>
          <li>Administrative and security audit alerts</li>
          <li>Tax invoice and delivery challan distribution</li>
        </ul>
        <p>
          You can manage route dispatch, review live settlement summaries, and audit delivery staff operations directly via the admin portal below.
        </p>
      `,
      metadata: [
        { label: 'Admin Account', value: adminEmail },
        { label: 'Environment', value: process.env.NODE_ENV || 'development' },
        { label: 'Server Port', value: process.env.PORT || '5000' },
        { label: 'Portal URL', value: 'http://localhost:5000/dashboard' },
        { label: 'Status', value: 'ACTIVE & VERIFIED' }
      ],
      callToAction: {
        text: 'Access Admin Dashboard',
        url: 'http://localhost:5000/dashboard'
      }
    };

    const result = await mailService.sendAdminMail(mailData);

    console.log('\n✓ Mail successfully dispatched!');
    console.log('----------------------------------------------------');
    console.log(`Recipient:       ${result.to}`);
    console.log(`Message ID:      ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`Preview URL:     ${result.previewUrl}`);
      console.log('----------------------------------------------------');
      console.log('ℹ You can copy and open the Preview URL in any browser to inspect the full HTML email.');
    } else {
      console.log('Dispatched via:  Production SMTP Server');
    }
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n✗ Error sending admin email:', error);
    process.exit(1);
  }
}

run();
