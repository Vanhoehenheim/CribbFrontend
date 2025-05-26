/**
 * Interface representing an item in the shopping cart.
 */
export interface ShoppingCartItem {
  id: string;          // MongoDB ObjectID as string
  user_id: string;     // ID of the user who added the item
  group_id: string;    // ID of the group the cart belongs to
  item_name: string;   // Name of the item
  quantity: number;    // Quantity of the item
  added_at: string;    // ISO 8601 date string when the item was added
  user_name?: string;  // Optional: Name of the user who added the item (included in list response)
} 