import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PantryService } from '../../services/pantry.service';
import { CategoryService } from '../../services/category.service';
import { PantryItem } from '../../models/pantry-item.model';
import { Category } from '../../models/category.model';
import { AddItemComponent } from './add-item/add-item.component';
import { ApiService } from '../../services/api.service';
import { ShoppingCartService } from '../../services/shopping-cart.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  iconoirMenu,
  iconoirEditPencil,
  iconoirCart,
  iconoirTrash
} from '@ng-icons/iconoir';

/**
 * PantryComponent manages the household's food inventory
 * Allows users to view, add, update and consume pantry items
 */
@Component({
  selector: 'app-pantry',
  templateUrl: './pantry.component.html',
  styleUrls: ['./pantry.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, AddItemComponent, NgIcon],
  providers: [
    provideIcons({
      iconoirMenu,
      iconoirEditPencil,
      iconoirCart,
      iconoirTrash
    })
  ]
})
export class PantryComponent implements OnInit {
  // Main items collections 
  pantryItems: PantryItem[] = [];          // All pantry items
  filteredItems: PantryItem[] = [];        // Items filtered by current category selection
  totalItems: number = 0;                // Total number of items in the pantry
  expiredItems: number = 0;                // Total number of items in the pantry
  
  // Filter state
  selectedCategoryId: string = '';         // Currently selected category ID filter
  categories: Category[] = [];             // All available categories (predefined + custom)
  loadingCategories = false;               // Loading state for categories
  
  // UI state
  loading: boolean = false;                // Loading indicator state
  error: string | null = null;              // Error message to display
  showAddItemForm: boolean = false;        // Controls visibility of add item form
  // addToCartSuccessMessage: string | null = null; // Removed: Handled in modal now
  // addToCartError: string | null = null; // Removed: Handled in modal now
  // isAddingToCart: { [itemId: string]: boolean } = {}; // Removed: Handled in modal now

  // State for Add to Cart Modal
  showAddToCartModal: boolean = false;
  itemForCartModal: PantryItem | null = null;
  quantityForCartModal: number = 1;
  isAddingToCartInModal: boolean = false;
  addToCartModalError: string | null = null;

  // Household and update state
  groupName: string = '';                  // Current household/group name
  itemToUpdate: PantryItem | null = null;  // Item being updated (if any)
  newQuantity: number = 0;                 // New quantity for item updates
  newExpiryDate: string = '';              // New expiry date for item updates

  // Dropdown menu states
  openMenuItemId: string | null = null;    // ID of item with open action menu
  showAdditionalCategoriesDropdown: boolean = false; // State for additional categories dropdown
  showMobileCategoriesDropdown: boolean = false; // State for mobile categories dropdown

  // ===== DELETE CONFIRMATION MODAL STATE =====
  deleteItemIdForConfirm: string | null = null; // Item ID pending deletion confirmation
  showDeleteConfirm: boolean = false;

  constructor(
    private pantryService: PantryService,  // Service for pantry CRUD operations
    private categoryService: CategoryService, // Service for category operations
    private apiService: ApiService,         // Service for user and auth operations
    private shoppingCartService: ShoppingCartService // Inject ShoppingCartService
  ) {}

  /**
   * Stats calculation methods for the template
   * Used to display summary information in the UI
   */
  getTotalItemCount(): number {
    return this.pantryItems.length;
  }
  
  getExpiringItemCount(): number {
    return this.pantryItems.filter(item => item.is_expiring_soon).length;
  }
  
  getOutOfStockItemCount(): number {
    return this.pantryItems.filter(item => item.quantity <= 0).length;
  }
  
  hasExpiringItems(): boolean {
    return this.getExpiringItemCount() > 0;
  }
  
  hasOutOfStockItems(): boolean {
    return this.getOutOfStockItemCount() > 0;
  }

  /**
   * Helper methods for filtering items by availability status
   */
  getAvailableItems(): PantryItem[] {
    return this.filteredItems.filter(item => item.quantity > 0);
  }

  getOutOfStockItems(): PantryItem[] {
    return this.filteredItems.filter(item => item.quantity <= 0);
  }

  hasAvailableItems(): boolean {
    return this.getAvailableItems().length > 0;
  }

  hasOutOfStockItemsFiltered(): boolean {
    return this.getOutOfStockItems().length > 0;
  }

  /**
   * Initialize component by loading user data and pantry items
   */
  ngOnInit(): void {
    // Get the current authenticated user data
    const userData = this.apiService.getCurrentUser();
    
    if (userData) {
      // Try to get group name from different possible properties
      // This handles different user object structures
      if (userData.groupName) {
        this.groupName = userData.groupName;
        this.loadCategories();
        this.loadAllPantryItems();
      } else if (userData.groupCode) {
        // Fallback if we only have a group code
        this.groupName = 'Pantry'; 
        console.log('Using test group name. Consider implementing a getGroupDetails API call');
        this.loadCategories();
        this.loadAllPantryItems();
      } else {
        // Development fallback
        this.groupName = 'Pantry';
        console.log('Using hardcoded group name for testing');
        this.loadCategories();
        this.loadAllPantryItems();
      }
    } else {
      this.error = 'User information not available. Please log in.';
      console.log('No user data available. User might not be logged in.');
    }
  }

  /**
   * Load all pantry items for the current household
   * Gets the complete list regardless of category to populate filters
   */
  loadAllPantryItems(): void {
    if (!this.groupName) {
      this.error = 'No group name available. Please join a group.';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Load all items with no category filter
    this.pantryService.listItems(this.groupName, '')
      .subscribe({
        next: (items) => {
          // Initialize selectedQuantity tracking property for each item
          this.pantryItems = items.map(item => ({
            ...item,
            selectedQuantity: 1
          }));
          
          // Apply any active category filter
          this.filterItems();
          
          this.loading = false;
          this.totalItems = this.getTotalItemCount()
          this.expiredItems = this.getExpiringItemCount()
        },
        error: (err) => {
          this.error = 'Failed to load pantry items';
          this.loading = false;
          console.error('Error loading pantry items:', err);
        }
      });
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
   * Get category name by ID
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  /**
   * Get categories that have at least one item
   */
  getCategoriesWithItems(): Category[] {
    if (!this.pantryItems || this.pantryItems.length === 0) {
      return [];
    }
    
    // Get unique category IDs from pantry items
    const categoryIdsWithItems = new Set(
      this.pantryItems.map(item => item.category_id).filter(id => id)
    );
    
    // Return categories that have items
    return this.categories.filter(category => 
      categoryIdsWithItems.has(category.id)
    );
  }

  /**
   * Get categories that don't have any items
   */
  getCategoriesWithoutItems(): Category[] {
    if (!this.pantryItems || this.pantryItems.length === 0) {
      return this.categories;
    }
    
    // Get unique category IDs from pantry items
    const categoryIdsWithItems = new Set(
      this.pantryItems.map(item => item.category_id).filter(id => id)
    );
    
    // Return categories that don't have items
    return this.categories.filter(category => 
      !categoryIdsWithItems.has(category.id)
    );
  }

  /**
   * Filter pantry items based on selected category ID
   * Updates filteredItems which drives the UI
   */
  filterItems(): void {
    if (!this.selectedCategoryId) {
      this.filteredItems = this.pantryItems; // Show all items
    } else {
      this.filteredItems = this.pantryItems.filter(
        item => item.category_id === this.selectedCategoryId
      );
    }
  }

  /**
   * Handle category filter selection
   * @param categoryId - The selected category ID to filter by
   */
  onCategoryChange(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.filterItems();
  }

  /**
   * Increase the selected quantity for an item (for use action)
   * @param item - The pantry item to update
   */
  incrementQuantity(item: PantryItem): void {
    if (item.selectedQuantity === undefined) {
      item.selectedQuantity = 1;
    }
    
    if (item.selectedQuantity < item.quantity) {
      item.selectedQuantity++;
    }
  }
  
  /**
   * Decrease the selected quantity for an item (for use action)
   * @param item - The pantry item to update
   */
  decrementQuantity(item: PantryItem): void {
    if (item.selectedQuantity === undefined) {
      item.selectedQuantity = 1;
    }
    
    if (item.selectedQuantity > 1) {
      item.selectedQuantity--;
    }
  }

  /**
   * Mark a pantry item as used/consumed
   * @param item - The pantry item being used
   * @param quantity - How many units to use
   */
  onUseItem(item: PantryItem, quantity: number): void {
    if (quantity > item.quantity) {
      this.error = `Cannot use more than the available quantity (${item.quantity} ${item.unit})`;
      return;
    }
    
    this.pantryService.useItem({
      item_id: item.id,
      quantity: quantity
    }).subscribe({
      next: (response) => {
        this.loadAllPantryItems(); // Refresh the pantry list
      },
      error: (err) => {
        this.error = 'Failed to use item';
        console.error('Error using item:', err);
      }
    });
  }

  /**
   * Delete a pantry item completely
   * @param itemId - ID of the item to delete
   */
  onDeleteItem(itemId: string): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.pantryService.deleteItem(itemId)
        .subscribe({
          next: () => {
            this.loadAllPantryItems(); // Refresh the pantry list
          },
          error: (err) => {
            this.error = 'Failed to delete item';
            console.error('Error deleting item:', err);
          }
        });
    }
  }

  /**
   * Toggle visibility of the add item form/modal
   */
  toggleAddItemForm(): void {
    this.showAddItemForm = !this.showAddItemForm;
    console.log('Add item form visibility:', this.showAddItemForm);
  }

  /**
   * Handle event when a new item is added through the form
   */
  onItemAdded(): void {
    console.log('Item added event received');
    this.loadAllPantryItems(); // Refresh the pantry list
    this.showAddItemForm = false; // Close the add form
  }

  /**
   * Handle click event on the modal background
   * Only closes if clicking outside the form itself
   * @param event - Mouse event from the click
   */
  closeAddItemForm(event: MouseEvent): void {
    // Get the target element
    const target = event.target as HTMLElement;
    
    // Check if the click was on the modal backdrop (the outermost div)
    // This works by checking if the clicked element has the modal's class
    if (target.classList.contains('fixed')) {
      this.showAddItemForm = false;
      console.log('Modal closed by background click');
    }
  }
  
  /**
   * Add a pantry item to the shopping list (future feature)
   * @param item - The pantry item to add to shopping list
   */
  addToShoppingList(item: PantryItem): void {
    // Simple placeholder for future shopping list integration
    console.log('Adding to shopping list:', item.name);
    
    this.error = ''; // Clear any existing errors
    alert(`Added ${item.name} to shopping list!`);
    
    // Future API implementation would go here
  }

  /**
   * Begin the update process for an item
   * @param item - The pantry item to update
   */
  onUpdateQuantity(item: PantryItem): void {
    this.itemToUpdate = item;
    this.newQuantity = item.quantity;
    
    // Format the expiry date for the date input (YYYY-MM-DD format)
    if (item.expiration_date) {
      const date = new Date(item.expiration_date);
      this.newExpiryDate = date.toISOString().split('T')[0];
    } else {
      this.newExpiryDate = '';
    }
  }

  /**
   * Cancel the current item update
   */
  cancelUpdate(): void {
    this.itemToUpdate = null;
  }

  /**
   * Save both quantity and expiry date updates for the current item
   */
  saveItemUpdate(): void {
    if (!this.itemToUpdate || this.newQuantity < 0) {
      return;
    }

    // Format expiry date in ISO 8601/RFC3339 format
    let formattedExpiryDate: string | undefined = undefined;
    if (this.newExpiryDate) {
      // Create a date at end of day in local timezone, then convert to ISO string
      const expiryDate = new Date(this.newExpiryDate);
      expiryDate.setHours(23, 59, 59, 999);
      formattedExpiryDate = expiryDate.toISOString();
    }

    // Use the updateItem method for updating existing items
    this.pantryService.updateItem(this.itemToUpdate.id, {
      name: this.itemToUpdate.name,
      quantity: this.newQuantity,
      unit: this.itemToUpdate.unit,
      category_id: this.itemToUpdate.category_id,
      group_name: this.groupName,
      expiration_date: formattedExpiryDate
    }).subscribe({
      next: () => {
        this.loadAllPantryItems(); // Refresh the pantry list
        this.itemToUpdate = null;  // Exit update mode
      },
      error: (err) => {
        this.error = 'Failed to update item';
        console.error('Error updating item:', err);
      }
    });
  }

  /**
   * Legacy method - replaced by saveItemUpdate
   * @deprecated Use saveItemUpdate instead
   */
  saveQuantityUpdate(): void {
    this.saveItemUpdate();
  }

  /**
   * Toggle the action menu dropdown for a specific item
   * @param itemId - ID of the item to toggle menu for
   */
  toggleActionMenu(itemId: string): void {
    if (this.openMenuItemId === itemId) {
      this.openMenuItemId = null; // Close menu if already open
    } else {
      this.openMenuItemId = itemId; // Open menu for this item
    }
  }

  /**
   * Close the action menu dropdown
   */
  closeActionMenu(): void {
    this.openMenuItemId = null;
  }

  /**
   * Check if action menu is open for a specific item
   * @param itemId - ID of the item to check
   */
  isActionMenuOpen(itemId: string): boolean {
    return this.openMenuItemId === itemId;
  }

  /**
   * Opens the modal to add a specific pantry item to the shopping cart.
   * @param item The pantry item to add.
   */
  openAddToCartModal(item: PantryItem): void {
    this.itemForCartModal = item;
    this.quantityForCartModal = 1; // Default to 1
    this.addToCartModalError = null; // Clear previous errors
    this.showAddToCartModal = true;
  }

  /**
   * Closes the Add to Cart modal.
   */
  closeAddToCartModal(): void {
    this.showAddToCartModal = false;
    this.itemForCartModal = null;
    this.quantityForCartModal = 1;
    this.addToCartModalError = null;
    this.isAddingToCartInModal = false; // Reset loading state
  }

  /**
   * Confirms adding the item (from the modal) to the shopping cart with the specified quantity.
   */
  confirmAddToCart(): void {
    if (!this.itemForCartModal || this.quantityForCartModal <= 0) {
      this.addToCartModalError = 'Please enter a valid quantity.';
      setTimeout(() => this.addToCartModalError = null, 3000);
      return;
    }

    this.isAddingToCartInModal = true;
    this.addToCartModalError = null;

    this.shoppingCartService.addItem(this.itemForCartModal.name, this.quantityForCartModal)
      .pipe(
        catchError((err) => {
          console.error('Error adding item to cart from modal:', err);
          this.addToCartModalError = err instanceof Error ? err.message : 'Failed to add item to cart.';
          // Don't clear error immediately, let user see it
          // setTimeout(() => this.addToCartModalError = null, 3000);
          return of(null); // Handle error locally
        })
      )
      .subscribe(result => {
        this.isAddingToCartInModal = false;
        if (result) {
          // Success
          console.log(`Item ${this.itemForCartModal?.name} added to shopping cart.`);
          // Optionally show a global success message here if desired
          // this.showGlobalSuccessMessage(`${this.itemForCartModal?.name} added to cart!`);
          this.closeAddToCartModal(); // Close modal on success
        }
        // Error case is handled in catchError, message is displayed in modal
      });
  }

  /**
   * Toggle the visibility of the additional categories dropdown
   */
  toggleAdditionalCategoriesDropdown(): void {
    this.showAdditionalCategoriesDropdown = !this.showAdditionalCategoriesDropdown;
  }

  /**
   * Close the additional categories dropdown
   */
  closeAdditionalCategoriesDropdown(): void {
    this.showAdditionalCategoriesDropdown = false;
  }

  /**
   * Toggle the visibility of the mobile categories dropdown
   */
  toggleMobileCategoriesDropdown(): void {
    this.showMobileCategoriesDropdown = !this.showMobileCategoriesDropdown;
  }

  /**
   * Close the mobile categories dropdown
   */
  closeMobileCategoriesDropdown(): void {
    this.showMobileCategoriesDropdown = false;
  }

  /**
   * Get the display name of the currently selected category
   */
  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) {
      return 'All Items';
    }
    const category = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return category ? category.name : 'All Items';
  }

  /**
   * Open the nicely-styled confirmation modal before deleting an item
   */
  openDeleteConfirm(itemId: string): void {
    this.deleteItemIdForConfirm = itemId;
    this.showDeleteConfirm = true;
  }

  /** Cancel deletion */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteItemIdForConfirm = null;
  }

  /** Perform deletion after confirmation */
  confirmDelete(): void {
    if (!this.deleteItemIdForConfirm) {
      return;
    }
    const itemId = this.deleteItemIdForConfirm;
    this.showDeleteConfirm = false;
    this.deleteItemIdForConfirm = null;
    this.pantryService.deleteItem(itemId)
      .subscribe({
        next: () => {
          this.loadAllPantryItems();
        },
        error: (err) => {
          this.error = 'Failed to delete item';
          console.error('Error deleting item:', err);
          setTimeout(() => this.error = null, 3000);
        }
      });
  }
}