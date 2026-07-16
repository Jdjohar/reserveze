import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Business, Employee, OtpVerification } from '@/models';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

const SALT = 'appoint-salt-123456';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, email, password, name, businessName, newPassword, otpCode } = body;

    if (action === 'change-password') {
      if (!email || !newPassword) {
        return NextResponse.json({ success: false, error: 'Email and new password are required' }, { status: 400 });
      }
      const cleanEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      const passwordHash = hashPassword(newPassword);
      user.passwordHash = passwordHash;
      user.needsPasswordChange = false;
      await user.save();
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    if (action === 'send-signup-otp') {
      if (!email) {
        return NextResponse.json({ success: false, error: 'Email is required to send verification code' }, { status: 400 });
      }
      const cleanEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
      }

      // Generate 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete existing codes and create new
      await OtpVerification.deleteMany({ email: cleanEmail });
      await OtpVerification.create({
        email: cleanEmail,
        code: generatedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      });

      // Send verification email
      await sendEmail({
        to: cleanEmail,
        subject: 'Reserveze Signup Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #06b6d4; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
            <p>Hello,</p>
            <p>Thank you for signing up as a merchant on <strong>Reserveze</strong>. Please use the following 6-digit verification code to complete your registration:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; padding: 15px; background-color: #f1f5f9; border-radius: 8px; margin: 20px 0; color: #0f172a;">
              ${generatedCode}
            </div>
            <p style="font-size: 12px; color: #64748b;">This code is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 10px; color: #94a3b8; text-align: center;">&copy; 2026 Reserveze. All rights reserved.</p>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (action === 'signup') {
      if (!name || !businessName) {
        return NextResponse.json({ success: false, error: 'Name and Business Name are required for signup' }, { status: 400 });
      }
      if (!otpCode) {
        return NextResponse.json({ success: false, error: 'Verification OTP code is required for signup' }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
      }

      // Verify OTP
      const otpEntry = await OtpVerification.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
      if (!otpEntry) {
        return NextResponse.json({ success: false, error: 'Verification code not found. Please request a new one.' }, { status: 400 });
      }
      if (otpEntry.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'Verification code expired. Please request a new one.' }, { status: 400 });
      }
      if (otpEntry.code !== otpCode.trim()) {
        return NextResponse.json({ success: false, error: 'Invalid verification code.' }, { status: 400 });
      }

      // Delete verified OTP
      await OtpVerification.deleteOne({ _id: otpEntry._id });

      // Create new user
      const passwordHash = hashPassword(password);
      const newUser = await User.create({
        name,
        email: cleanEmail,
        passwordHash,
        role: 'MERCHANT'
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Account created successfully!',
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });

    } else {
      // Login check
      let user = await User.findOne({ email: cleanEmail });
      const employee = await Employee.findOne({ email: cleanEmail, isActive: true });

      if (!user && !employee) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      // If user exists as an Employee but doesn't have a login User record yet, initialize it!
      if (employee && !user) {
        user = await User.create({
          name: `${employee.firstName} ${employee.lastName}`,
          email: cleanEmail,
          role: 'MERCHANT'
        });
      }

      if (user) {
        // If user exists but has no password hash (legacy user), initialize it on their first login!
        if (!user.passwordHash) {
          const hash = hashPassword(password);
          user.passwordHash = hash;
          await user.save();
        }

        const hash = hashPassword(password);
        if (user.passwordHash !== hash) {
          return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
        }
      }

      // Resolve business scope
      let businessId = null;
      let assignedCalendarIds = null;

      // Check if they are the owner of any business
      const business = user ? await Business.findOne({ merchantId: user._id }) : null;

      if (business) {
        // Business owner gets full access to all calendars
        businessId = business._id;
        assignedCalendarIds = null;
      } else if (employee) {
        // Restricted employee manager gets only their assigned calendars
        businessId = employee.businessId;
        assignedCalendarIds = employee.calendarIds;
      }

      return NextResponse.json({
        success: true,
        user: {
          name: user ? user.name : (employee ? `${employee.firstName} ${employee.lastName}` : 'Merchant'),
          email: cleanEmail,
          role: user ? user.role : 'MERCHANT'
        },
        businessId,
        assignedCalendarIds,
        needsPasswordChange: !!(user && user.needsPasswordChange)
      });
    }

  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
