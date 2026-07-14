import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { connectToDatabase } from '@/lib/db';
import { User, Business, Employee } from '@/models';

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'appoint-default-nextauth-secret-123456';
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'dummy_secret',
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.APPLE_CLIENT_SECRET || 'dummy_secret',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        await connectToDatabase();
        const cleanEmail = user.email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: cleanEmail });

        if (!existingUser) {
          // Check if this email is an invited employee/manager
          const employee = await Employee.findOne({ email: cleanEmail, isActive: true });
          
          await User.create({
            name: user.name || (employee ? `${employee.firstName} ${employee.lastName}` : 'Merchant User'),
            email: cleanEmail,
            role: 'MERCHANT',
            needsPasswordChange: false
          });
        }
        return true;
      } catch (err) {
        console.error('[NextAuth SignIn Callback Error]:', err);
        return false;
      }
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          await connectToDatabase();
          const cleanEmail = token.email.toLowerCase().trim();
          const userObj = await User.findOne({ email: cleanEmail });

          if (userObj) {
            token.id = userObj._id.toString();
            
            // Check if they own a business
            const business = await Business.findOne({ merchantId: userObj._id });
            if (business) {
              token.businessId = business._id.toString();
            } else {
              // Check if they are an employee/manager
              const employee = await Employee.findOne({ email: cleanEmail, isActive: true });
              if (employee) {
                token.businessId = employee.businessId.toString();
                token.assignedCalendarIds = employee.calendarIds.map((id: any) => id.toString());
              }
            }
          }
        } catch (err) {
          console.error('[NextAuth JWT Callback Error]:', err);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.businessId = token.businessId;
        session.user.assignedCalendarIds = token.assignedCalendarIds;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  }
});

export { handler as GET, handler as POST };
