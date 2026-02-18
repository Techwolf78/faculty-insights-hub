# EmailJS Configuration Guide

## ✅ SETUP COMPLETE!

Your EmailJS integration is now fully configured and ready to use!

### **Current Configuration:**
- **Service ID**: `service_s9nh482` ✅
- **Template ID**: `template_qy89apm` ✅
- **Public Key**: `UeCAvDPTKfBP6JcG4` ✅
- **Email Service**: Gmail API ✅
- **Template Name**: Welcome ✅

### **How to Use:**
1. Go to your INSYT admin dashboard
2. Navigate to "Bulk Email" section
3. Select faculty members (individual or select all)
4. Click "Send Bulk Email"
5. Watch the progress and results

### **Email Template Features:**
- iOS-style clean design
- Includes Faculty ID, Full Name, Email, and Password
- Security reminders
- Professional branding
- Mobile-responsive

### **Monthly Limits:**
- 200 free emails per month
- Resets on March 8th
- Monitor usage in EmailJS dashboard

### **Troubleshooting:**
If emails fail to send:
1. Check EmailJS dashboard for service status
2. Verify your Gmail connection is active
3. Check browser console for error messages
4. Ensure you have remaining email quota

**Your bulk email system is ready to go! 🚀**

---

## 📧 **Updated Email Template (Simplified Design)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
    <title>INSYT • Clean welcome</title>
    <style>
        /* Clean style – simple, professional, fixed colors */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: #f2f5f9; /* Fixed beige background */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #1d2c4f; /* Fixed dark blue text */
            padding: 40px 12px 20px 12px;
            margin: 0;
        }

        .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 32px;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.02);
            overflow: hidden;
        }

        .header {
            padding: 32px 28px 28px 28px;
            background: linear-gradient(145deg, #f9fbfd 0%, #f0f4fa 100%);
            border-bottom: 1px solid rgba(60, 60, 67, 0.06);
        }

        .logo-wrapper {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .logo {
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #1d2c4f;
        }

        .badge {
            color: #1d2c4f;
            font-size: 15px;
            font-weight: 500;
            display: inline-block;
            white-space: nowrap;
        }

        .company-name {
            margin-top: 4px;
        }

        .company {
            font-size: 16px;
            font-weight: 500;
            color: #4b5568;
            letter-spacing: -0.01em;
        }

        .subtitle {
            font-size: 15px;
            color: #4b5568;
            font-weight: 380;
            margin: 4px 0 0 0;
        }

        .content {
            padding: 28px 28px 20px 28px;
        }

        .greeting {
            margin-bottom: 26px;
        }

        .greeting p {
            font-size: 16px;
            color: #1d2c4f;
        }

        .greeting strong {
            font-weight: 590;
            color: #1d2c4f;
        }

        .credentials-card {
            background-color: #f8fafd;
            border-radius: 22px;
            padding: 22px 24px;
            margin: 24px 0 28px 0;
            border: 1px solid rgba(84, 84, 88, 0.08);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
        }

        .cred-title {
            font-size: 15px;
            font-weight: 590;
            color: #1d2c4f;
            margin-bottom: 18px;
            letter-spacing: 0.3px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .cred-row {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.04);
            gap: 12px;
        }

        .cred-row:last-of-type {
            border-bottom: none;
        }

        .cred-label {
            font-size: 15px;
            font-weight: 450;
            color: #4b4b55;
            margin-right: 16px;
        }

        .cred-value {
            font-family: 'SF Mono', 'JetBrains Mono', 'Courier New', monospace;
            font-size: 15px;
            font-weight: 500;
            color: #1d2c4f;
            letter-spacing: 0.2px;
            word-break: break-all;
        }

        .security-note {
            background-color: #fff9e6;
            border-radius: 20px;
            padding: 20px 24px;
            margin: 28px 0 30px 0;
            border: 1px solid rgba(255, 180, 40, 0.15);
        }

        .security-title {
            font-size: 15px;
            font-weight: 600;
            color: #9c6e00;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .security-text {
            font-size: 15px;
            color: #5e4a1a;
            margin: 0;
            line-height: 1.5;
        }

        .cta-wrapper {
            text-align: center;
            margin: 32px 0 28px;
        }

        .cta-button {
            display: inline-block;
            background: #1d2c4f !important;
            color: white !important;
            text-decoration: none !important;
            padding: 16px 36px !important;
            font-weight: 590 !important;
            font-size: 17px !important;
            letter-spacing: 0.2px !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 18px rgba(25, 40, 70, 0.18) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .footer {
            background-color: #f8fafd;
            padding: 28px 28px 30px 28px;
            border-top: 1px solid rgba(84, 84, 88, 0.06);
        }

        .footer-logo-small {
            font-size: 20px;
            font-weight: 620;
            color: #1d2c4f;
            margin-bottom: 10px;
            letter-spacing: -0.3px;
        }

        .footer-text {
            color: #6c6e7a;
            font-size: 14px;
            margin: 3px 0;
            line-height: 1.5;
        }

        .footer-note {
            margin-top: 22px;
            font-size: 13px;
            color: #8e8e98;
            border-top: 1px solid rgba(0,0,0,0.04);
            padding-top: 20px;
        }

        @media (max-width: 480px) {
            body {
                padding: 20px 8px 20px 8px;
            }
            
            .container {
                border-radius: 28px;
            }
            
            .header {
                padding: 24px 20px 20px 20px;
            }
            
            .logo-wrapper {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
            
            .logo {
                font-size: 24px;
            }
            
            .badge {
                font-size: 14px;
                padding: 4px 12px;
            }
            
            .content {
                padding: 20px 20px 16px 20px;
            }
            
            .credentials-card {
                padding: 18px 18px;
                margin: 20px 0 22px 0;
            }
            
            .cred-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                padding: 14px 0;
            }
            
            .cred-value {
                width: 100%;
                text-align: left;
                font-size: 14px;
            }
            
            .cred-label {
                font-size: 14px;
            }
            
            .security-note {
                padding: 18px 18px;
                margin: 22px 0 24px 0;
            }
            
            .cta-wrapper {
                margin: 24px 0 22px;
            }
            
            .cta-button {
                padding: 16px 28px;
                font-size: 16px;
                width: 100%;
                display: block;
                text-align: center;
            }
            
            .footer {
                padding: 22px 20px 24px 20px;
            }
        }

        @media (max-width: 360px) {
            .header {
                padding: 20px 16px 16px 16px;
            }
            
            .logo {
                font-size: 22px;
            }
            
            .badge {
                font-size: 13px;
            }
            
            .content {
                padding: 16px 16px 12px 16px;
            }
            
            .cred-value {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-wrapper">
                <span class="logo">Gryphon Academy</span>
            </div>
            <div class="company-name">
                <span class="company">INSYT</span>
            </div>
            <p class="subtitle">Turn Feedback into Insight.</p>
        </div>

        <div class="content">
            <div class="greeting">
                <p>Dear <strong>{{name}}</strong>,</p>
                <p>Welcome to INSYT. Your account is ready.</p>
            </div>

            <div class="credentials-card">
                <div class="cred-title">
                    <span>🔐</span> one‑time login
                </div>
                <div class="cred-row">
                    <span class="cred-label">Faculty ID</span>
                    <span class="cred-value">{{employeeId}}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Full Name</span>
                    <span class="cred-value">{{name}}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Email</span>
                    <span class="cred-value">{{email}}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">Password</span>
                    <span class="cred-value">{{password}}</span>
                </div>
            </div>

            <div class="security-note">
                <div class="security-title">
                    <span>🛡️</span> first login? change password
                </div>
                <p class="security-text">This temporary password is for immediate access only. After signing in, go to the profile settings and change your password.</p>
            </div>

            <div class="cta-wrapper">
                <a href="https://faculty.gryphonacademy.co.in/" class="cta-button">
                    Open INSYT →
                </a>
            </div>

            <p style="font-size: 15px; color: #3a3a44; margin: 24px 0 16px;">If you have any questions, contact us at feedback.support@indiraicem.ac.in</p>

            <p style="font-size: 15px; color: #3a3a44;">
                Best regards,<br>
                <span style="font-weight: 500; color: #1d2c4f;">The Gryphon Academy team</span>
            </p>
        </div>

        <div class="footer">
            <div class="footer-logo-small">Gryphon Academy</div>
            <p class="footer-text">INSYT – Turn Feedback into Insight</p>
            <p class="footer-text" style="margin-top: 4px;">© 2026 · academic platform</p>
            <div class="footer-note">
                This is an automated message from our system. Please do not reply directly.
            </div>
        </div>
    </div>
</body>
</html>
```