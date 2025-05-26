import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { ShoppingCartItem } from './models/shopping-cart-item.model'; // Import the model
import { ApiService } from './services/api.service'; // Import ApiService

// Interface for the expected API list response structure
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
    // Expect the response object structure
    return this.http.get<ShoppingCartListResponse>(`${this.apiUrl}/list`, { headers })
      .pipe(
        map(response => response.data), // Extract the data array from the response
        tap(items => this._cartItems.set(items)), // Update the signal with the extracted array
        catchError(this.handleError) // Centralized error handling
      );
  }

  /**
   * Adds an item to the shopping cart.
   * @param itemName Name of the item to add.
   * @param quantity Quantity of the item to add.
   */
  addItem(itemName: string, quantity: number): Observable<ShoppingCartItem> {
    const headers = this.apiService.getAuthHeaders();
    if (!headers) {
      return throwError(() => new Error('User not authenticated or token missing.'));
    }
    const body = { item_name: itemName, quantity };
    // Assuming the add endpoint returns the newly created/updated item
    // Adjust the response type if the API returns something else (e.g., just a message)
    return this.http.post<ShoppingCartItem>(`${this.apiUrl}/add`, body, { headers })
      .pipe(
        tap((newItem) => {
          // Optimistically update the signal, or refetch the list
          // For simplicity here, we refetch the list to ensure consistency
          this.getCartItems().subscribe(); // Trigger a refetch
        }),
        catchError(this.handleError)
      );
  }

  // Basic error handler (can be expanded)
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    // Return an observable with a user-facing error message
    return throwError(() => new Error('Something went wrong while fetching shopping cart items; please try again later.'));
  }
}
