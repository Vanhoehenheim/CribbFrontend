import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PantryService } from '../../../services/pantry.service';
import { CategoryService } from '../../../services/category.service';
import { ApiService } from '../../../services/api.service';
import { Category, CategoriesResponse } from '../../../models/category.model';

/**
 * AddItemComponent provides a form UI for adding new items to the pantry
 * Handles form validation, submission, and communicates with PantryService
 */
@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class AddItemComponent implements OnInit {
  // Event emitter to signal to parent when item is successfully added
  @Output() itemAdded = new EventEmitter<void>();
  @Output() closeForm = new EventEmitter<void>();
  
  // Form and state variables
  itemForm: FormGroup;          // Form group for item data fields
  loading = false;              // Tracks loading state during submission
  error = '';                   // Error message if submission fails
  success = false;              // Success flag for feedback
  groupName = '';               // Household group name for the API request

  // Category management
  categories: Category[] = [];  // All available categories (predefined + custom)
  loadingCategories = false;    // Loading state for categories
  showCreateCategory = false;   // Show create category form
  newCategoryName = '';         // New category name input

  constructor(
    private fb: FormBuilder,           // Angular form builder service
    private pantryService: PantryService, // Service for pantry operations
    private categoryService: CategoryService, // Service for category operations
    private apiService: ApiService     // Service for user and auth
  ) {
    // Initialize the form with validation rules
    this.itemForm = this.fb.group({
      name: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required]],
      category_id: ['', [Validators.required]], // Changed to category_id and made required
      expiration_date: [''],
      group_name: ['', [Validators.required]]
    });
  }

  /**
   * Initialize component and set up the group name from user data
   */
  ngOnInit(): void {
    // Get current authenticated user data
    const userData = this.apiService.getCurrentUser();
    
    if (userData) {
      // Try to get group name from different user object structures
      if (userData.groupName) {
        this.groupName = userData.groupName;
      }else if (userData.groupCode) {
        // Fallback for testing
        this.groupName = 'Pantry';
        console.log('Using test group name in AddItemComponent');
      } else {
        this.error = 'No group information found';
        console.log('User data available but no group info in AddItemComponent');
      }
      
      // Set the group_name field in the form
      this.itemForm.patchValue({
        group_name: this.groupName
      });

      // Load categories for the group
      this.loadCategories();
    } else {
      this.error = 'User information not available';
    }
  }

  /**
   * Handle form submission to add a new pantry item
   * Validates the form, formats data, and calls the API service
   */
  onSubmit(): void {
    if (this.itemForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = false;

      // Create a clean copy of the form data
      const itemData = {...this.itemForm.value};
      
      // Format expiration date in ISO 8601 format for API
      if (itemData.expiration_date) {
        const date = new Date(itemData.expiration_date);
        date.setHours(23, 59, 59, 999);
        itemData.expiration_date = date.toISOString();
      }

      // Submit the item data to the pantry service
      this.pantryService.addItem(itemData)
        .subscribe({
          next: () => {
            // Handle successful submission
            this.success = true;
            this.itemForm.reset({
              group_name: this.groupName
            });
            this.itemAdded.emit(); // Notify parent component
          },
          error: (err) => {
            // Handle error case
            this.error = err.error?.message || 'Failed to add item';
            console.error('Error adding item:', err);
            this.loading = false;
          },
          complete: () => {
            this.loading = false;
          }
        });
    }
  }

  /**
   * Load categories for the current group
   */
  loadCategories(): void {
    if (!this.groupName) {
      return;
    }

    this.loadingCategories = true;
    this.categoryService.getCategories(this.groupName)
      .subscribe({
        next: (response) => {
          // Combine predefined and custom categories
          this.categories = [
            ...response.categories.predefined,
            ...response.categories.user_defined
          ];
          this.loadingCategories = false;
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.error = 'Failed to load categories';
          this.loadingCategories = false;
        }
      });
  }

  /**
   * Create a new custom category
   */
  createCustomCategory(): void {
    if (!this.newCategoryName.trim()) {
      return;
    }

    this.loading = true;
    this.categoryService.createCustomCategory({ name: this.newCategoryName.trim() })
      .subscribe({
        next: (response) => {
          // Add the new category to the list
          this.categories.push(response.data);
          this.newCategoryName = '';
          this.showCreateCategory = false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creating category:', err);
          this.error = err.error?.message || 'Failed to create category';
          this.loading = false;
        }
      });
  }

  /**
   * Cancel creating a new category
   */
  cancelCreateCategory(): void {
    this.showCreateCategory = false;
    this.newCategoryName = '';
  }

  /**
   * Get filtered categories by type
   */
  getFilteredCategories(type: 'predefined' | 'custom'): Category[] {
    return this.categories.filter(category => category.type === type);
  }

  /**
   * Check if there are any custom categories
   */
  hasCustomCategories(): boolean {
    return this.categories.some(category => category.type === 'custom');
  }
} 