import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Business, Employee } from '@/models';
import crypto from 'crypto';

const SALT = 'appoint-salt-123456';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, email, password, name, businessName } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (action === 'signup') {
      if (!name || !businessName) {
        return NextResponse.json({ success: false, error: 'Name and Business Name are required for signup' }, { status: 400 });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
      }

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
        assignedCalendarIds
      });
    }

  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
