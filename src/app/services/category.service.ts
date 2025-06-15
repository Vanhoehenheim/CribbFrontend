import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Category, 
  CategoriesResponse, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '../models/category.model';
import { ApiService } from './api.service';

/**
 * CategoryService handles all API interactions related to category management
 * Provides methods for fetching, creating, updating, and deleting categories
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // Base URL for category-related API endpoints
  private apiUrl = 'http://localhost:8080/api/pantry';

  constructor(
    private http: HttpClient,      // Angular HTTP client for API requests
    private apiService: ApiService // Service for authentication headers
  ) { }

  /**
   * Get all categories for a group (predefined + custom)
   * @param groupName - Name of the household group
   * @returns Observable with categories response
   */
  getCategories(groupName: string): Observable<CategoriesResponse> {
    const headers = this.apiService.getAuthHeaders();
    const url = `${this.apiUrl}/categories?group_name=${groupName}`;
    return this.http.get<CategoriesResponse>(url, { headers });
  }

  /**
   * Create a new custom category
   * @param request - Category creation request
   * @returns Observable with created category
   */
  createCustomCategory(request: CreateCategoryRequest): Observable<{ status: string; message: string; data: Category }> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.post<{ status: string; message: string; data: Category }>(
      `${this.apiUrl}/categories/create`, 
      request, 
      { headers }
    );
  }

  /**
   * Update a custom category
   * @param categoryId - ID of the category to update
   * @param request - Category update request
   * @returns Observable with success response
   */
  updateCustomCategory(categoryId: string, request: UpdateCategoryRequest): Observable<{ status: string; message: string }> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.put<{ status: string; message: string }>(
      `${this.apiUrl}/categories/${categoryId}`, 
      request, 
      { headers }
    );
  }

  /**
   * Delete a custom category
   * @param categoryId - ID of the category to delete
   * @returns Observable with success response
   */
  deleteCustomCategory(categoryId: string): Observable<{ status: string; message: string }> {
    const headers = this.apiService.getAuthHeaders();
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/categories/${categoryId}`, 
      { headers }
    );
  }
} 