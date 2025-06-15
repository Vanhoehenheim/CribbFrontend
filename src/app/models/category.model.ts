/**
 * Represents a category in the system
 */
export interface Category {
  id: string;                   // Category ObjectID
  name: string;                 // Category display name
  type: 'predefined' | 'custom'; // Category type
  group_id?: string;            // Group ID (only for custom categories)
  group_name?: string;          // Group name (only for custom categories)
  created_by?: string;          // Creator user ID (only for custom categories)
  created_by_id?: string;       // Creator user ID (only for custom categories)
  created_at?: string;          // Creation timestamp (only for custom categories)
  is_active?: boolean;          // Active status (only for custom categories)
}

/**
 * Response format for categories API
 */
export interface CategoriesResponse {
  group_name: string;
  group_id: string;
  categories: {
    predefined: Category[];
    user_defined: Category[];
  };
}

/**
 * Request payload for creating a custom category
 */
export interface CreateCategoryRequest {
  name: string;                 // Category name
}

/**
 * Request payload for updating a custom category
 */
export interface UpdateCategoryRequest {
  name: string;                 // Updated category name
} 