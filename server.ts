import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage keyed by 10-digit phone
const otpStore = new Map<string, OtpRecord>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // POST /api/send-otp - Send real OTP via SMS Gateway
  app.post('/api/send-otp', async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Mobile number is required' });
      }

      // Normalize 10-digit Indian phone number
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          error: 'অনুগ্ৰহ কৰি সঠিক ১০-অংকৰ ম’বাইল নম্বৰ দিয়ক',
        });
      }

      // Generate a secure 4-digit numeric OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      otpStore.set(cleanPhone, {
        otp,
        expiresAt,
        attempts: 0,
      });

      console.log(`[OTP Engine] Generated OTP for +91 ${cleanPhone}: ${otp}`);

      let deliveredVia = 'none';
      let gatewayMessage = '';

      // 1. Try Fast2SMS Gateway (popular Indian SMS gateway for instant OTP)
      if (process.env.FAST2SMS_API_KEY) {
        try {
          const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'otp',
              variables_values: otp,
              numbers: cleanPhone,
            }),
          });
          const smsData = await smsRes.json();
          console.log('[Fast2SMS response]', smsData);
          if (smsData?.return === true) {
            deliveredVia = 'fast2sms';
            gatewayMessage = 'OTP SMS আপোনাৰ ম’বাইললৈ প্ৰেৰণ কৰা হৈছে (Fast2SMS)';
          } else {
            console.warn('[Fast2SMS failed]', smsData);
          }
        } catch (fastErr) {
          console.error('[Fast2SMS error]', fastErr);
        }
      }

      // 2. Try Twilio Gateway (if Fast2SMS not configured or failed)
      if (
        deliveredVia === 'none' &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      ) {
        try {
          const auth = Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64');
          const params = new URLSearchParams();
          params.append('To', `+91${cleanPhone}`);
          params.append('From', process.env.TWILIO_PHONE_NUMBER);
          params.append(
            'Body',
            `DocLocker: আপোনাৰ সুৰক্ষিত OTP হল ${otp}। এই কোড কাৰো সৈতে ভাগ নকৰিব। Valid for 5 mins.`
          );

          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            }
          );
          const twilioData = await twilioRes.json();
          console.log('[Twilio response]', twilioData);
          if (twilioRes.ok) {
            deliveredVia = 'twilio';
            gatewayMessage = 'OTP SMS আপোনাৰ ম’বাইললৈ প্ৰেৰণ কৰা হৈছে (Twilio)';
          }
        } catch (twilioErr) {
          console.error('[Twilio error]', twilioErr);
        }
      }

      const hasSmsGateway = Boolean(
        process.env.FAST2SMS_API_KEY ||
        (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
      );

      return res.json({
        success: true,
        phone: cleanPhone,
        deliveredVia: deliveredVia !== 'none' ? deliveredVia : (hasSmsGateway ? 'failed_gateway' : 'simulator'),
        hasSmsGateway,
        gatewayMessage: gatewayMessage || undefined,
        // In preview environments without SMS Gateway keys configured, provide test OTP so user can test seamlessly
        debugOtp: !hasSmsGateway || deliveredVia === 'none' ? otp : undefined,
        expiresInSeconds: 300,
      });
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      return res.status(500).json({ success: false, error: 'OTP প্ৰেৰণ কৰোঁতে সমস্যা হৈছে' });
    }
  });

  // POST /api/verify-otp - Verify OTP entered by user
  app.post('/api/verify-otp', (req, res) => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const record = otpStore.get(cleanPhone);

      if (!record) {
        return res.status(400).json({
          success: false,
          error: 'কোনো OTP বিচাৰি পোৱা নগ’ল। অনুগ্ৰহ কৰি পুনৰ "OTP প্ৰেৰণ কৰক" টিপক।',
        });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({
          success: false,
          error: 'OTP ৰ ম্যাদ শেষ হৈছে। নতুন OTP লওক।',
        });
      }

      record.attempts += 1;
      if (record.attempts > 5) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({
          success: false,
          error: 'অত্যধিক ভুল প্ৰচেষ্টা। অনুগ্ৰহ কৰি নতুন OTP অনুৰোধ কৰক।',
        });
      }

      const cleanOtp = String(otp).trim();
      if (cleanOtp !== record.otp) {
        return res.status(400).json({
          success: false,
          error: 'অশুদ্ধ OTP কোড! অনুগ্ৰহ কৰি ম’বাইলত অহা ৪-অংকৰ OTP কোডটো বহাওক।',
        });
      }

      // Verification successful! Clean up used OTP
      otpStore.delete(cleanPhone);

      return res.json({
        success: true,
        message: 'OTP সফলতাৰে যাচাইন হ’ল!',
        verifiedPhone: `+91 ${cleanPhone}`,
      });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      return res.status(500).json({ success: false, error: 'যাচাইন প্ৰক্ৰিয়াত সমস্যা হৈছে' });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`DocLocker Server running on port ${PORT}`);
  });
}

startServer();
