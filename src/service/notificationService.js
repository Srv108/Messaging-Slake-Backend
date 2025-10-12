import { addEmailToMailQueue } from '../Producer/mailQueueProducer.js';
import { generatedNotificationMail } from '../utils/common/mailObject.js';

/**
 * Send notification to offline user
 * @param {object} recipient - User object { _id, username, email }
 * @param {object} sender - Sender object { _id, username, email }
 * @param {object} message - Message object { body, image, createdAt }
 * @param {string} type - Notification type: 'room' or 'channel'
 */
export const sendOfflineNotification = async (recipient, sender, message, type = 'room') => {
    try {
        console.log(`[Notification] Sending to offline user: ${recipient.email}`);
        
        // Prepare notification data
        const notificationData = {
            recipientEmail: recipient.email,
            recipientName: recipient.username,
            senderName: sender.username,
            senderEmail: sender.email,
            messagePreview: truncateMessage(message.body, 100),
            messageType: type,
            timestamp: message.createdAt || new Date().toISOString(),
            hasImage: !!message.image
        };

        // Send email notification
        const emailData = generatedNotificationMail(notificationData);
        await addEmailToMailQueue(emailData);

        console.log(`[Notification] Email queued for ${recipient.email}`);

        // TODO: Add push notification service here (Firebase, OneSignal, etc.)
        // await sendPushNotification(recipient, sender, message);

        return {
            success: true,
            notificationSent: true,
            recipient: recipient.email
        };
    } catch (error) {
        console.error('[Notification] Error sending notification:', error);
        return {
            success: false,
            notificationSent: false,
            error: error.message
        };
    }
};

/**
 * Send notifications to multiple offline users
 * @param {Array} recipients - Array of user objects
 * @param {object} sender - Sender object
 * @param {object} message - Message object
 * @param {string} type - Notification type
 */
export const sendBulkOfflineNotifications = async (recipients, sender, message, type = 'channel') => {
    try {
        const notifications = await Promise.allSettled(
            recipients.map(recipient => 
                sendOfflineNotification(recipient, sender, message, type)
            )
        );

        const successful = notifications.filter(n => n.status === 'fulfilled' && n.value.success).length;
        const failed = notifications.length - successful;

        console.log(`[Notification] Bulk send complete: ${successful} sent, ${failed} failed`);

        return {
            total: recipients.length,
            successful,
            failed
        };
    } catch (error) {
        console.error('[Notification] Error in bulk notification:', error);
        throw error;
    }
};

/**
 * Truncate message for preview
 * @param {string} message - Full message
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated message
 */
function truncateMessage(message, maxLength = 100) {
    if (!message) return 'New message';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
}

/**
 * Check if user should receive notification
 * @param {string} userId - User ID
 * @param {string} senderId - Sender ID
 * @returns {boolean}
 */
export const shouldNotifyUser = (userId, senderId) => {
    // Don't notify sender
    if (userId === senderId) return false;
    
    // TODO: Add user preferences check here
    // - Check if user has muted notifications
    // - Check if user has muted this conversation
    // - Check do not disturb settings
    
    return true;
};
