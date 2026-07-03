import mongoose, { Schema, Document, Model } from 'mongoose';

// User Schema
export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  name: string;
  role: 'SUPER_ADMIN' | 'MERCHANT' | 'CUSTOMER';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String },
  name: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'MERCHANT', 'CUSTOMER'], default: 'MERCHANT' },
}, { timestamps: true });

// Business Schema
export interface IBusiness extends Document {
  merchantId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  slug?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  whatsapp?: string;
  address?: string;
  plan: 'BASIC' | 'PRO';
  bookingCreditsBalance: number;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  smsCreditsUsed: number;
  smsCreditsCap: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "Salon", "Dentist", "Restaurant"
  slug: { type: String, unique: true, sparse: true, index: true },
  phone: { type: String },
  email: { type: String },
  logoUrl: { type: String },
  whatsapp: { type: String },
  address: { type: String },
  plan: { type: String, enum: ['BASIC', 'PRO'], default: 'BASIC' },
  bookingCreditsBalance: { type: Number, default: 50 },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  },
  smsCreditsUsed: { type: Number, default: 0 },
  smsCreditsCap: { type: Number, default: 100 } // Free Tier standard cap
}, { timestamps: true });

// Calendar Schema
export interface ICalendar extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  timezone: string;
  timeFormat: '12h' | '24h';
  phone?: string;
  email?: string;
  address?: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSchema = new Schema<ICalendar>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  timezone: { type: String, default: 'UTC' },
  timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  slug: { type: String, unique: true, sparse: true, index: true }
}, { timestamps: true });

// Availability Schema
export interface IAvailability extends Document {
  calendarId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isEnabled: boolean;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
  breaks: Array<{ startTime: string; endTime: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>({
  calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  isEnabled: { type: Boolean, default: true },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '17:00' },
  breaks: [{
    startTime: { type: String },
    endTime: { type: String }
  }]
}, { timestamps: true });

// Service Schema
export interface IService extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  duration: number; // total duration in minutes (calculated from hours + minutes)
  durationHours: number;
  durationMinutes: number;
  price: number;
  maxCapacity: number; // default 1
  advanceBookingDays: number;
  advanceBookingHours: number;
  advanceBookingMinutes: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  duration: { type: Number, required: true, default: 30 },
  durationHours: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 30 },
  price: { type: Number, required: true, default: 0 },
  maxCapacity: { type: Number, default: 1 },
  advanceBookingDays: { type: Number, default: 0 },
  advanceBookingHours: { type: Number, default: 0 },
  advanceBookingMinutes: { type: Number, default: 0 },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Client Schema
export interface IClient extends Document {
  businessId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  primaryNotificationChannel: 'email' | 'whatsapp' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  primaryNotificationChannel: { type: String, enum: ['email', 'whatsapp', 'sms'], default: 'email' }
}, { timestamps: true });

// Appointment Schema
export interface IAppointment extends Document {
  calendarId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  primaryChannel: 'email' | 'whatsapp' | 'sms';
  notificationCount: {
    email: number;
    sms: number;
    whatsapp: number;
  };
  lastRescheduledAt?: Date;
  rescheduleCountInCooldownWindow: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true, index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'], default: 'PENDING' },
  primaryChannel: { type: String, enum: ['email', 'whatsapp', 'sms'], default: 'email' },
  notificationCount: {
    email: { type: Number, default: 0 },
    sms: { type: Number, default: 0 },
    whatsapp: { type: Number, default: 0 }
  },
  lastRescheduledAt: { type: Date },
  rescheduleCountInCooldownWindow: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

// BlockedTime Schema
export interface IBlockedTime extends Document {
  calendarId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlockedTimeSchema = new Schema<IBlockedTime>({
  calendarId: { type: Schema.Types.ObjectId, ref: 'Calendar', required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  reason: { type: String },
  notes: { type: String }
}, { timestamps: true });

// Employee / Team Member Schema
export interface IEmployee extends Document {
  businessId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'MANAGER' | 'STAFF' | 'SPECIALIST';
  calendarIds: mongoose.Types.ObjectId[];
  serviceIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['MANAGER', 'STAFF', 'SPECIALIST'], default: 'STAFF' },
  calendarIds: [{ type: Schema.Types.ObjectId, ref: 'Calendar' }],
  serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compiles and exports models, checks for existing compilations in Next.js dev server.
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Business: Model<IBusiness> = mongoose.models.Business || mongoose.model<IBusiness>('Business', BusinessSchema);
export const Calendar: Model<ICalendar> = mongoose.models.Calendar || mongoose.model<ICalendar>('Calendar', CalendarSchema);
export const Availability: Model<IAvailability> = mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);
export const Service: Model<IService> = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
export const Client: Model<IClient> = mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
export const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export const BlockedTime: Model<IBlockedTime> = mongoose.models.BlockedTime || mongoose.model<IBlockedTime>('BlockedTime', BlockedTimeSchema);
export const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
