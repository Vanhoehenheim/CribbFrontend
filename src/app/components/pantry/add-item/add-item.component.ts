import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PantryService } from '../../../services/pantry.service';
import { ApiService } from '../../../services/api.service';

/**
 * AddItemComponent provides a form UI for adding new items to the pantry
 * Handles form validation, submission, and communicates with PantryService
 */
@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddItemComponent implements OnInit {
  // Event emitter to signal to parent when item is successfully added
  @Output() itemAdded = new EventEmitter<void>();
  
  // Form and state variables
  itemForm: FormGroup;          // Form group for item data fields
  loading = false;              // Tracks loading state during submission
  error = '';                   // Error message if submission fails
  success = false;              // Success flag for feedback
  groupName = '';               // Household group name for the API request

  constructor(
    private fb: FormBuilder,           // Angular form builder service
    private pantryService: PantryService, // Service for pantry operations
    private apiService: ApiService     // Service for user and auth
  ) {
    // Initialize the form with validation rules
    this.itemForm = this.fb.group({
      name: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required]],
      category: [''],
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
} 