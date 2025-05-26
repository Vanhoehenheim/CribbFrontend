/**
 * Represents a notification in the system
 * Contains information about pantry items that require attention
 */
export interface Notification {
  id: string;                   // Unique identifier for the notification
  group_id: string;             // ID of the related household group
  item_id: string;              // ID of the related pantry item
  item_name: string;            // Name of the pantry item
  type: NotificationType;       // Type of notification (expiring, expired, low_stock)
  message: string;              // Notification message
  created_at: string;           // Creation timestamp
  read_by: string[];            // List of user IDs who have read this notification
  current_quantity?: number;    // Current quantity for low stock items
  unit?: string;                // Unit of measurement
  is_read: boolean;             // Whether the notification has been read by current user
}

/**
 * Enum for notification types
 */
export enum NotificationType {
  EXPIRING = 'expiring',        // Item is expiring soon
  EXPIRED = 'expired',          // Item has expired
  LOW_STOCK = 'low_stock',      // Item is low in stock or out of stock
  OUT_OF_STOCK = 'out_of_stock'           // General warning notification
}

/**
 * Response model for notification lists
 */
export interface NotificationResponse {
  notifications: Notification[];
  count?: number;                // Total count of notifications
  unread_count?: number;         // Count of unread notifications
} 