import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  subject: string;
  body: string;
}

export const getEmailTemplate = (status: string, bookingDetails: any): EmailTemplate => {
  switch (status) {
    case 'ACCEPTED':
      return {
        subject: 'Your Booking Has Been Accepted',
        body: `Dear ${bookingDetails.customer.name},\n\nYour booking has been accepted by ${bookingDetails.tailor.name}. They will begin working on your order soon.\n\nBooking Details:\nDate: ${new Date(bookingDetails.availability.date).toLocaleDateString()}\nTime: ${bookingDetails.availability.startTime}\n\nThank you for choosing our service!`
      };
    case 'REJECTED':
      return {
        subject: 'Booking Update: Unable to Proceed',
        body: `Dear ${bookingDetails.customer.name},\n\nUnfortunately, your booking request could not be accepted at this time. Please try booking another available slot.\n\nThank you for your understanding.`
      };
    case 'IN_PROGRESS':
      return {
        subject: 'Your Order is Now in Progress',
        body: `Dear ${bookingDetails.customer.name},\n\n${bookingDetails.tailor.name} has started working on your order. We'll keep you updated on the progress.\n\nExpected completion: ${new Date(bookingDetails.requestedDeliveryDate).toLocaleDateString()}\n\nThank you for your patience!`
      };
    case 'READY_FOR_FITTING':
      return {
        subject: 'Your Order is Ready for Fitting',
        body: `Dear ${bookingDetails.customer.name},\n\nYour order is ready for fitting! Please schedule a fitting appointment with ${bookingDetails.tailor.name}.\n\nThank you for choosing our service!`
      };
    case 'COMPLETED':
      return {
        subject: 'Your Order is Complete',
        body: `Dear ${bookingDetails.customer.name},\n\nYour order has been completed! You can now collect your items from ${bookingDetails.tailor.name}.\n\nThank you for choosing our service!`
      };
    default:
      return {
        subject: 'Booking Update',
        body: `Dear ${bookingDetails.customer.name},\n\nThere has been an update to your booking. Please check your dashboard for more details.\n\nThank you for choosing our service!`
      };
  }
};

export const sendEmail = async (to: string, template: EmailTemplate) => {
  try {
    const result = await resend.emails.send({
      from: 'TailorMe <notifications@tailorme.com>',
      to: [to],
      subject: template.subject,
      text: template.body,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}; 