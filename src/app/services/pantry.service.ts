import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PantryItem, AddPantryItemRequest, UsePantryItemRequest, UsePantryItemResponse } from '../models/pantry-item.model';
import { ApiService } from './api.service';

/**
 * PantryService handles all API interactions related to pantry management
 * Provides methods for adding, using, listing, and deleting pantry items
 */
@Injectable({
  providedIn: 'root'
})
export class PantryService {
  // Base URL for pantry-related API endpoints
  private apiUrl = 'http://localhost:8080/api/pantry';

  constructor(
    private http: HttpClient,      // Angular HTTP client for API requests
    private apiService: ApiService // Service for authentication headers
  ) { }

  /**
   * Add a new item to the pantry or update an existing one
   * @param item - The pantry item data to add
   * @returns Observable with the created/updated item
   */
  addItem(item: AddPantryItemRequest): Observable<PantryItem> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.post<PantryItem>(`${this.apiUrl}/add`, item, { headers });
  }

  /**
   * Mark a pantry item as used/consumed
   * @param request - Contains item ID and quantity to use
   * @returns Observable with usage response and remaining quantity
   */
  useItem(request: UsePantryItemRequest): Observable<UsePantryItemResponse> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.post<UsePantryItemResponse>(`${this.apiUrl}/use`, request, { headers });
  }

  /**
   * List all pantry items for a household, optionally filtered by category
   * @param groupName - Name of the household group
   * @param category - Optional category to filter by
   * @returns Observable with array of pantry items
   */
  listItems(groupName: string, category?: string): Observable<PantryItem[]> {
    let url = `${this.apiUrl}/list?group_name=${groupName}`;
    if (category) {
      url += `&category=${category}`;
    }
    const headers = this.apiService.getAuthHeaders();
    return this.http.get<PantryItem[]>(url, { headers });
  }

  /**
   * Delete a pantry item completely
   * @param itemId - ID of the item to delete
   * @returns Observable with success message
   */
  deleteItem(itemId: string): Observable<{ message: string }> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.delete<{ message: string }>(`${this.apiUrl}/remove/${itemId}`, { headers });
  }
} 