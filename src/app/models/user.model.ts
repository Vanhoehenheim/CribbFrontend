/**
 * User interface represents the structure of a user in the application
 * Used for consistent type safety when handling user data throughout the app
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roomNo: string;
  groupId?: string;
  groupCode?: string;
  groupName?: string;
  createdAt?: string;
  lastLogin?: string;
  score?: number;
}