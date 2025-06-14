/**
 * Represents a pantry item stored in the system
 * Contains all properties of an item in the household inventory 
 */
export interface PantryItem {
  id: string;                   // Unique identifier
  group_id: string;             // ID of the household group
  name: string;                 // Name of the pantry item
  quantity: number;             // Current quantity of the item
  unit: string;                 // Unit of measurement (e.g., lbs, oz, each)
  category_id: string;          // Category ObjectID (required)
  expiration_date?: string;     // Optional date when item expires
  added_by: string;             // ID of user who added the item
  created_at: string;           // Creation timestamp
  updated_at: string;           // Last update timestamp
  is_expiring_soon?: boolean;   // Flag for items expiring soon
  is_expired?: boolean;         // Flag for expired items
  added_by_name?: string;       // Display name of user who added the item
  selectedQuantity?: number;    // UI state for quantity selector
  category_info?: CategoryInfo; // Resolved category information
}

/**
 * Category information returned with pantry items
 */
export interface CategoryInfo {
  id: string;                   // Category ObjectID
  name: string;                 // Category display name
  type: 'predefined' | 'custom'; // Category type
}

/**
 * Request payload for adding a new pantry item
 */
export interface AddPantryItemRequest {
  name: string;                 // Name of the item
  quantity: number;             // Initial quantity
  unit: string;                 // Unit of measurement
  category_id: string;          // Required category ObjectID
  expiration_date?: string;     // Optional expiration date
  group_name: string;           // Name of the household group
}

/**
 * Request payload for updating an existing pantry item
 */
export interface UpdatePantryItemRequest {
  name: string;                 // Name of the item
  quantity: number;             // Updated quantity
  unit: string;                 // Unit of measurement
  category_id: string;          // Required category ObjectID
  expiration_date?: string;     // Optional expiration date
  group_name: string;           // Name of the household group
}

/**
 * Request payload for using/consuming a pantry item
 */
export interface UsePantryItemRequest {
  item_id: string;              // ID of the item to use
  quantity: number;             // Quantity to consume
}

/**
 * Response when using/consuming a pantry item
 */
export interface UsePantryItemResponse {
  success: boolean;             // Whether the operation succeeded
  message: string;              // Status message
  remaining_quantity: number;   // Remaining quantity after use
  unit: string;                 // Unit of measurement 
} 