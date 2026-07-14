import { Appointment, Business, Client, IAppointment, IBusiness, IClient } from '@/models';

interface NotificationResult {
  success: boolean;
  channel: 'email' | 'sms' | 'whatsapp' | 'none';
  message: string;
  costIncurred: boolean;
}

/**
 * Checks if a merchant has exceeded their monthly SMS/WhatsApp credits
 */
async function hasSmsCredits(businessId: string): Promise<boolean> {
  const business = await Business.findById(businessId);
  if (!business) return false;
  return business.smsCreditsUsed < business.smsCreditsCap;
}

/**
 * Deducts 1 credit from the merchant's SMS wallet
 */
async function deductSmsCredit(businessId: string): Promise<void> {
  await Business.findByIdAndUpdate(businessId, {
    $inc: { smsCreditsUsed: 1 }
  });
}

/**
 * Triggers a simulated notification
 */
async function sendNotification(
  appointment: IAppointment,
  client: IClient,
  channel: 'email' | 'sms' | 'whatsapp',
  content: string
): Promise<NotificationResult> {
  // 1. Check rate limits (max 3 mobile notifications per appointment)
  if (channel === 'sms' || channel === 'whatsapp') {
    const totalMobileSent = (appointment.notificationCount.sms || 0) + (appointment.notificationCount.whatsapp || 0);
    if (totalMobileSent >= 3) {
      console.warn(`[LIMIT EXCEEDED] Max 3 mobile notifications reached for appointment ${appointment._id}. Falling back to Email.`);
      return sendNotification(appointment, client, 'email', `[FALLBACK FROM MOBILE] ${content}`);
    }

    // Check credits
    const hasCredits = await hasSmsCredits(appointment.calendarId.toString()); // Note: calendarId belongs to business in schema, we will resolve business from client/appointment
    const clientDetails = await Client.findById(appointment.clientId);
    if (clientDetails) {
      const businessHasCredits = await hasSmsCredits(clientDetails.businessId.toString());
      if (!businessHasCredits) {
        console.warn(`[OUT OF CREDITS] Merchant has run out of SMS credits. Falling back to Email.`);
        return sendNotification(appointment, client, 'email', `[FALLBACK: MERCH OUT OF CREDITS] ${content}`);
      }
    }
  }

  // 2. Perform dispatch simulation
  console.log(`[DISPATCHING] Channel: ${channel.toUpperCase()} | To: ${client.email} / ${client.phone} | Content: "${content}"`);

  // 3. Update notification counts in DB
  const incField = `notificationCount.${channel}`;
  await Appointment.findByIdAndUpdate(appointment._id, {
    $inc: { [incField]: 1 }
  });

  // Deduct merchant credit if mobile channel
  if (channel === 'sms' || channel === 'whatsapp') {
    const clientDetails = await Client.findById(appointment.clientId);
    if (clientDetails) {
      await deductSmsCredit(clientDetails.businessId.toString());
    }
  }

  return {
    success: true,
    channel,
    message: `Message sent successfully via ${channel}`,
    costIncurred: channel !== 'email'
  };
}

/**
 * Main Entry Point for sending transactional updates (Booked, Rescheduled, Cancelled)
 */
export async function triggerTransactionalNotification(
  appointmentId: string,
  type: 'BOOKING_CONFIRMED' | 'RESCHEDULED' | 'CANCELLED',
  trackingLink: string
): Promise<NotificationResult> {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  const client = await Client.findById(appointment.clientId);
  if (!client) throw new Error('Client not found');

  // Cooldown validation (15 mins) for Reschedule spam
  if (type === 'RESCHEDULED') {
    const now = new Date();
    const lastRescheduled = appointment.lastRescheduledAt;
    
    // Check if within 15 minutes
    if (lastRescheduled && (now.getTime() - lastRescheduled.getTime()) < 15 * 60 * 1000) {
      console.warn(`[COOLDOWN ACTIVE] Appointment ${appointmentId} rescheduled within 15 minutes. Falling back to Email.`);
      
      // Update fields
      await Appointment.findByIdAndUpdate(appointmentId, {
        $inc: { rescheduleCountInCooldownWindow: 1 },
        lastRescheduledAt: now
      });

      return sendNotification(
        appointment,
        client,
        'email',
        `Your appointment has been rescheduled. View live details here: ${trackingLink}`
      );
    }

    // Update last rescheduled timestamp
    await Appointment.findByIdAndUpdate(appointmentId, {
      lastRescheduledAt: now
    });
  }

  // Determine Channel based on single channel preference architecture
  const primaryChannel = appointment.primaryChannel || 'email';
  const targetChannel = primaryChannel;
  let textContent = '';

  // Setup template content
  if (type === 'BOOKING_CONFIRMED') {
    textContent = `Appointment Booked! View or manage your schedule here: ${trackingLink}`;
    if (targetChannel === 'whatsapp') {
      textContent += `\n\nReply "1" to confirm or "2" to cancel/reschedule.`;
    }
  } else if (type === 'RESCHEDULED') {
    textContent = `Your appointment has been rescheduled. New details: ${trackingLink}`;
  } else if (type === 'CANCELLED') {
    textContent = `Your appointment has been cancelled. Details: ${trackingLink}`;
  }

  return sendNotification(appointment, client, targetChannel, textContent);
}

/**
 * Cron/Batch Cascade logic simulation
 * Run this checker regularly to trigger fallback alerts 4 hours before slot
 */
export async function runReminderCascadeCheck(): Promise<number> {
  const now = new Date();
  
  // Find appointments occurring between 4 and 6 hours from now
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const appointmentsToRemind = await Appointment.find({
    startTime: { $gte: fourHoursLater, $lte: sixHoursLater },
    status: 'PENDING' // Only remind if not already confirmed/completed
  });

  let alertsSent = 0;
  for (const appointment of appointmentsToRemind) {
    const client = await Client.findById(appointment.clientId);
    if (!client) continue;

    // Check if we already sent a mobile reminder to avoid double charging
    const mobileSent = (appointment.notificationCount.sms || 0) + (appointment.notificationCount.whatsapp || 0);
    
    if (mobileSent === 0 && (appointment.primaryChannel === 'sms' || appointment.primaryChannel === 'whatsapp')) {
      // First 24h prior, email goes out (which has notificationCount.email > 0)
      // If email has been sent but appointment is still pending 4 hours before, we cascade to SMS/WhatsApp fallback
      if (appointment.notificationCount.email > 0) {
        console.log(`[CASCADE TRIGGERED] Appointment ${appointment._id} is still PENDING 4 hours before. Cascading to ${appointment.primaryChannel.toUpperCase()}`);
        await sendNotification(
          appointment,
          client,
          appointment.primaryChannel,
          `Reminder: Your appointment is in 4 hours. Confirm here: http://localhost:3000/booking/track/${appointment._id}`
        );
        alertsSent++;
      }
    }
  }

  return alertsSent;
}

/**
 * Triggers the free/cheap initial 24h prior confirmation Email
 */
export async function send24HourEmailReminder(appointmentId: string): Promise<NotificationResult> {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  const client = await Client.findById(appointment.clientId);
  if (!client) throw new Error('Client not found');

  const content = `Confirm your upcoming appointment tomorrow. Click here to confirm: http://localhost:3000/booking/track/${appointment._id}?action=confirm`;
  return sendNotification(appointment, client, 'email', content);
}
