import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { ShoppingCartItem } from '../models/shopping-cart-item.model'; // Import the model
import { ApiService } from './api.service'; // Import ApiService

// Define an interface for the API list response structure
interface ShoppingCartListResponse {
  status: string;
  message: string;
  data: ShoppingCartItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService); // Inject ApiService
  private apiUrl = 'http://localhost:8080/api/shopping-cart'; // Hardcode API URL

  // Signal to hold the shopping cart items
  private _cartItems = signal<ShoppingCartItem[]>([]);

  // Public readonly signal exposed to components
  cartItems = computed(() => this._cartItems());

  constructor() { }

  /**
   * Fetches shopping cart items from the API and updates the signal.
   */
  getCartItems(): Observable<ShoppingCartItem[]> {
    const headers = this.apiService.getAuthHeaders(); // Get auth headers
    if (!headers) {
      return throwError(() => new Error('User not authenticated or token missing.'));
    }
    // Expect the specific response structure
    return this.http.get<ShoppingCartListResponse>(`${this.apiUrl}/list`, { headers })
      .pipe(
        map(response => response.data), // Extract the data array
        tap(items => {
          this._cartItems.set(items); // Set the signal with the extracted array
        }),
        catchError(this.handleError) // Centralized error handling
      );
  }

  /**
   * Adds an item to the shopping cart via the API and refreshes the list.
   * @param itemName Name of the item to add.
   * @param quantity Quantity of the item.
   * @returns Observable<ShoppingCartItem[]> The updated list of items.
   */
  addItem(itemName: string, quantity: number): Observable<ShoppingCartItem[]> {
    const headers = this.apiService.getAuthHeaders();
    if (!headers) {
      return throwError(() => new Error('User not authenticated or token missing.'));
    }
    const body = { item_name: itemName, quantity };

    // Assuming add response might also be nested, but only care about refetching
    return this.http.post<any>(`${this.apiUrl}/add`, body, { headers })
      .pipe(
        // No need to log response here anymore
        switchMap(() => this.getCartItems()), // Refresh the list after adding
        catchError(this.handleError)
      );
  }

  /**
   * Updates an item in the shopping cart via the API and refreshes the list.
   * @param itemId The ID of the item to update.
   * @param itemName Optional new name for the item.
   * @param quantity Optional new quantity for the item.
   * @returns Observable<ShoppingCartItem[]> The updated list of items.
   */
  updateItem(itemId: string, itemName?: string, quantity?: number): Observable<ShoppingCartItem[]> {
    const headers = this.apiService.getAuthHeaders();
    if (!headers) {
      return throwError(() => new Error('User not authenticated or token missing.'));
    }

    // Construct the body with only the provided fields
    const body: { item_id: string; item_name?: string; quantity?: number } = { item_id: itemId };
    if (itemName !== undefined) {
      body.item_name = itemName;
    }
    if (quantity !== undefined) {
      body.quantity = quantity;
    }

    // Assuming the API endpoint for update is /api/shopping-cart/update
    // and it accepts PUT requests with the item details in the body.
    return this.http.put<any>(`${this.apiUrl}/update`, body, { headers })
      .pipe(
        switchMap(() => this.getCartItems()), // Refresh the list after updating
        catchError(this.handleError)
      );
  }

  /**
   * Deletes an item from the shopping cart via the API and refreshes the list.
   * @param itemId The ID of the item to delete.
   * @returns Observable<ShoppingCartItem[]> The updated list of items.
   */
  deleteItem(itemId: string): Observable<ShoppingCartItem[]> {
    const headers = this.apiService.getAuthHeaders();
    if (!headers) {
      return throwError(() => new Error('User not authenticated or token missing.'));
    }

    return this.http.delete<any>(`${this.apiUrl}/delete/${itemId}`, { headers })
      .pipe(
        switchMap(() => this.getCartItems()), // Refresh the list after deleting
        catchError(this.handleError)
      );
  }

  // Basic error handler (can be expanded)
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    // Return an observable with a user-facing error message
    // Customize error message based on operation if needed
    let userMessage = 'Something went wrong; please try again later.';
    if (error.status === 0) {
      userMessage = 'Could not connect to the server. Please check your network connection.';
    } else if (error.error && typeof error.error === 'object' && error.error.message) {
        // Check if error.error exists and is an object before accessing message
        userMessage = `Error: ${error.error.message}`;
    } else if (typeof error.error === 'string') {
        // Sometimes the error message is directly in error.error
        userMessage = error.error;
    } else if (error.message) {
      userMessage = error.message;
    }
    return throwError(() => new Error(userMessage));
  }
}
