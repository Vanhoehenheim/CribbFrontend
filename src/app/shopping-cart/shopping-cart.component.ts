import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingCartService } from '../services/shopping-cart.service';
import { ShoppingCartItem } from '../models/shopping-cart-item.model';
import { PantryService } from '../services/pantry.service';
import { ApiService } from '../services/api.service';
import { AddPantryItemRequest } from '../models/pantry-item.model';
import { switchMap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './shopping-cart.component.html',
  styleUrl: './shopping-cart.component.css'
})
export class ShoppingCartComponent implements OnInit {
  private shoppingCartService = inject(ShoppingCartService);
  private pantryService = inject(PantryService);
  private apiService = inject(ApiService);

  cartItems = this.shoppingCartService.cartItems;

  // State for the add item form
  newItemName: string = '';
  newItemQuantity: number = 1;
  isAddingItem: boolean = false; // To show loading/disabled state on button
  error: string | null = null;
  showAddItemForm: boolean = false; // Controls visibility of the add item modal

  // State for the edit item form
  editingItem: ShoppingCartItem | null = null;
  editItemName: string = '';
  editItemQuantity: number = 1;
  isUpdatingItem: boolean = false;
  showEditForm: boolean = false;

  // State for Add to Pantry Modal
  showAddToPantryModal: boolean = false;
  itemForPantryModal: ShoppingCartItem | null = null;
  pantryCategory: string = '';
  pantryExpiryDate: string = '';
  isAddingToPantryInModal: boolean = false;
  addToPantryModalError: string | null = null;

  ngOnInit(): void {
    this.shoppingCartService.getCartItems().subscribe({
      error: (err: any) => {
        console.error('Error fetching shopping cart items:', err);
        // Display error message using the refined message from the service
        this.error = err instanceof Error ? err.message : 'Failed to load shopping cart.';
      }
    });
  }

  /**
   * Toggles the visibility of the add item modal.
   * Resets the form fields when the modal is closed.
   */
  toggleAddItemForm() {
    this.showAddItemForm = !this.showAddItemForm;
    if (!this.showAddItemForm) {
      // Reset form when closing
      this.newItemName = '';
      this.newItemQuantity = 1;
      this.error = null; // Clear errors when closing the modal
    }
  }

  /**
   * Closes the add item modal if the click occurs outside the modal content.
   * @param event The mouse event.
   */
  closeAddItemForm(event: MouseEvent) {
    // Close modal only if the backdrop (event.currentTarget) is clicked
    if (event.target === event.currentTarget) {
      this.toggleAddItemForm();
    }
  }

  /**
   * Handles the submission of the add item form.
   * Calls the service to add the item and closes the modal on success.
   */
  onAddItemSubmit(): void {
    if (!this.newItemName || this.newItemQuantity <= 0) {
      this.error = 'Please enter a valid item name and quantity.';
      // Clear the error message after a delay
      setTimeout(() => this.error = null, 3000);
      return;
    }

    this.isAddingItem = true;
    this.error = null;

    this.shoppingCartService.addItem(this.newItemName, this.newItemQuantity).subscribe({
      next: () => {
        // Success - list is refetched by the service automatically
        this.isAddingItem = false;
        this.toggleAddItemForm(); // Close the modal after successful submission
        // Form reset is now handled in toggleAddItemForm
      },
      error: (err: any) => {
        console.error('Error adding item:', err);
        // Display error message using the refined message from the service
        this.error = err instanceof Error ? err.message : 'Failed to add item. Please try again.';
        this.isAddingItem = false;
        // Clear the error message after a delay
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  /**
   * Opens the edit item modal and pre-fills it with the item's data.
   * @param item The item to edit.
   */
  openEditModal(item: ShoppingCartItem): void {
    this.editingItem = item;
    this.editItemName = item.item_name;
    this.editItemQuantity = item.quantity;
    this.showEditForm = true;
    this.error = null; // Clear previous errors
  }

  /**
   * Closes the edit item modal.
   */
  closeEditModal(): void {
    this.showEditForm = false;
    this.editingItem = null;
    this.editItemName = '';
    this.editItemQuantity = 1;
    this.error = null;
  }

   /**
   * Closes the edit item modal if the click occurs outside the modal content.
   * @param event The mouse event.
   */
  closeEditModalBackdrop(event: MouseEvent) {
    // Close modal only if the backdrop (event.currentTarget) is clicked
    if (event.target === event.currentTarget) {
      this.closeEditModal();
    }
  }

  /**
   * Handles the submission of the edit item form.
   * Calls the service to update the item and closes the modal on success.
   */
  onEditSubmit(): void {
    if (!this.editingItem || !this.editItemName || this.editItemQuantity <= 0) {
      this.error = 'Please enter a valid item name and quantity.';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    this.isUpdatingItem = true;
    this.error = null;

    this.shoppingCartService.updateItem(
      this.editingItem.id,
      this.editItemName,
      this.editItemQuantity
    ).subscribe({
      next: () => {
        // Success - list is refetched by the service automatically
        this.isUpdatingItem = false;
        this.closeEditModal(); // Close the modal after successful update
      },
      error: (err: any) => {
        console.error('Error updating item:', err);
        this.error = err instanceof Error ? err.message : 'Failed to update item. Please try again.';
        this.isUpdatingItem = false;
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  /**
   * Opens the modal to collect details before adding a shopping cart item to the pantry.
   * @param item The shopping cart item to add to the pantry.
   */
  openAddToPantryModal(item: ShoppingCartItem): void {
    this.itemForPantryModal = item;
    this.pantryCategory = ''; // Reset fields
    this.pantryExpiryDate = '';
    this.addToPantryModalError = null;
    this.isAddingToPantryInModal = false;
    this.showAddToPantryModal = true;
  }

  /**
   * Closes the Add to Pantry modal.
   */
  closeAddToPantryModal(): void {
    this.showAddToPantryModal = false;
    this.itemForPantryModal = null;
    this.pantryCategory = '';
    this.pantryExpiryDate = '';
    this.addToPantryModalError = null;
    this.isAddingToPantryInModal = false;
  }

  /**
   * Handles the confirmation from the Add to Pantry modal.
   * Adds item to pantry with details, then removes from cart.
   */
  confirmAddToPantry(): void {
    if (!this.itemForPantryModal || !this.pantryCategory) {
      this.addToPantryModalError = 'Please enter a category for the pantry item.';
      setTimeout(() => this.addToPantryModalError = null, 3000);
      return;
    }

    const currentUser = this.apiService.getCurrentUser();
    if (!currentUser || !currentUser.groupName) {
      this.addToPantryModalError = 'Could not find user group information.';
      setTimeout(() => this.addToPantryModalError = null, 3000);
      return;
    }

    this.isAddingToPantryInModal = true;
    this.addToPantryModalError = null;

    // Format expiry date if provided
    let formattedExpiryDate: string | undefined = undefined;
    if (this.pantryExpiryDate) {
      try {
        const expiryDate = new Date(this.pantryExpiryDate);
        expiryDate.setHours(23, 59, 59, 999); // Set to end of day
        formattedExpiryDate = expiryDate.toISOString();
      } catch (e) {
        console.error('Invalid date format for expiry date:', this.pantryExpiryDate);
        this.addToPantryModalError = 'Invalid expiry date format. Please use YYYY-MM-DD.';
        this.isAddingToPantryInModal = false;
        return;
      }
    }

    const pantryItemRequest: AddPantryItemRequest = {
      name: this.itemForPantryModal.item_name,
      quantity: this.itemForPantryModal.quantity,
      unit: 'units', // Still using default unit
      category: this.pantryCategory,
      group_name: currentUser.groupName,
      expiration_date: formattedExpiryDate
    };

    this.pantryService.addItem(pantryItemRequest).pipe(
      switchMap(() => {
        console.log(`Successfully added ${this.itemForPantryModal?.item_name} to pantry. Deleting from cart...`);
        return this.shoppingCartService.deleteItem(this.itemForPantryModal!.id);
      }),
      catchError((err: any) => {
        console.error('Error in confirmAddToPantry process:', err);
        this.addToPantryModalError = err instanceof Error ? err.message : 'Failed to add item to pantry or remove from cart.';
        this.isAddingToPantryInModal = false;
        // Keep modal open on error to show message
        return EMPTY; // Prevent error from propagating further
      })
    ).subscribe({
      next: () => {
        console.log(`Item ${this.itemForPantryModal?.id} successfully removed from cart after adding to pantry.`);
        this.closeAddToPantryModal(); // Close modal on final success
      },
      // Error handled by catchError
    });
  }

  /**
   * Deletes an item from the shopping cart by calling the service.
   * @param itemId The ID of the item to delete.
   */
  deleteItem(itemId: string) {
    this.error = null; // Clear previous errors
    // Optionally add a loading state for deletion
    // this.isDeleting[itemId] = true;

    this.shoppingCartService.deleteItem(itemId).subscribe({
      next: () => {
        // Success: The service automatically refreshes the list via getCartItems()
        console.log(`Item ${itemId} deleted successfully.`);
        // Optionally remove deletion loading state
        // delete this.isDeleting[itemId];
      },
      error: (err: any) => {
        console.error(`Error deleting item ${itemId}:`, err);
        this.error = err instanceof Error ? err.message : 'Failed to delete item.';
        // Optionally remove deletion loading state
        // delete this.isDeleting[itemId];
        setTimeout(() => this.error = null, 3000); // Clear error after delay
      }
    });
  }
}
