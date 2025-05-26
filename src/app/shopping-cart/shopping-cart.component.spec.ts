import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ShoppingCartComponent } from './shopping-cart.component';
import { ShoppingCartService } from '../services/shopping-cart.service';
import { PantryService } from '../services/pantry.service';
import { ApiService } from '../services/api.service';
import { ShoppingCartItem } from '../models/shopping-cart-item.model';
import { User } from '../models/user.model';

// Mock Services
class MockShoppingCartService {
  // Use a WritableSignal for testing
  private _cartItemsSource: WritableSignal<ShoppingCartItem[]> = signal([]);
  cartItems = this._cartItemsSource.asReadonly(); // Expose as readonly signal

  getCartItems = jasmine.createSpy('getCartItems').and.returnValue(of(undefined)); // Return observable for subscribe
  addItem = jasmine.createSpy('addItem').and.returnValue(of({ status: 'success', message: 'Item added' }));
  updateItem = jasmine.createSpy('updateItem').and.returnValue(of({ status: 'success', message: 'Item updated' }));
  deleteItem = jasmine.createSpy('deleteItem').and.returnValue(of({ status: 'success', message: 'Item deleted' }));

  // Helper to manually set the signal value for testing
  setCartItems(items: ShoppingCartItem[]) {
    this._cartItemsSource.set(items);
  }
}

class MockPantryService {
  addItem = jasmine.createSpy('addItem').and.returnValue(of({ status: 'success', message: 'Item added to pantry' }));
}

class MockApiService {
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue({
    id: 'user123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    groupName: 'TestGroup',
    points: 100,
    phone: '123-456-7890',
    roomNo: '101'
  } as User);
  user$ = of(this.getCurrentUser()); // Simulate user observable
}


describe('ShoppingCartComponent', () => {
  let component: ShoppingCartComponent;
  let fixture: ComponentFixture<ShoppingCartComponent>;
  let mockShoppingCartService: MockShoppingCartService;
  let mockPantryService: MockPantryService;
  let mockApiService: MockApiService;

  const mockItems: ShoppingCartItem[] = [
    { id: '1', item_name: 'Milk', quantity: 1, user_id: 'user123', group_id: 'group123', added_at: new Date().toISOString() },
    { id: '2', item_name: 'Bread', quantity: 2, user_id: 'user123', group_id: 'group123', added_at: new Date().toISOString() }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingCartComponent], // Import standalone component
      providers: [
        provideHttpClient(), // Provide HttpClient
        provideHttpClientTesting(), // Provide testing support for HttpClient
        { provide: ShoppingCartService, useClass: MockShoppingCartService },
        { provide: PantryService, useClass: MockPantryService },
        { provide: ApiService, useClass: MockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShoppingCartComponent);
    component = fixture.componentInstance;
    mockShoppingCartService = TestBed.inject(ShoppingCartService) as unknown as MockShoppingCartService;
    mockPantryService = TestBed.inject(PantryService) as unknown as MockPantryService;
    mockApiService = TestBed.inject(ApiService) as unknown as MockApiService;

    // Set initial signal value *before* first change detection
    mockShoppingCartService.setCartItems(mockItems);

    // Trigger ngOnInit and initial data binding
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getCartItems on initialization', () => {
    expect(mockShoppingCartService.getCartItems).toHaveBeenCalled();
  });

  it('should display cart items from the service signal', fakeAsync(() => {
    tick(); // Allow signal changes to propagate and rendering to complete
    fixture.detectChanges(); // Update the view after signal changes

    const compiled = fixture.nativeElement as HTMLElement;
    const itemElements = compiled.querySelectorAll('.bg-white.rounded-lg.shadow');
    expect(itemElements.length).toBe(mockItems.length);
    expect(itemElements[0].textContent).toContain('Milk');
    expect(itemElements[1].textContent).toContain('Bread');
  }));

  // --- Add Item Tests ---
  describe('Add Item', () => {
    it('should open and close the add item modal', () => {
      expect(component.showAddItemForm).toBeFalse();
      component.toggleAddItemForm();
      expect(component.showAddItemForm).toBeTrue();
      component.toggleAddItemForm();
      expect(component.showAddItemForm).toBeFalse();
    });

    it('should reset add item form when closing modal', () => {
      component.newItemName = 'Test Item';
      component.newItemQuantity = 5;
      component.toggleAddItemForm(); // Open
      component.toggleAddItemForm(); // Close
      expect(component.newItemName).toBe('');
      expect(component.newItemQuantity).toBe(1);
      expect(component.error).toBeNull();
    });

    it('should call shoppingCartService.addItem on valid submission', fakeAsync(() => {
      component.newItemName = 'Eggs';
      component.newItemQuantity = 12;
      component.toggleAddItemForm(); // Open the modal first
      fixture.detectChanges(); // Detect changes to show modal

      component.onAddItemSubmit();
      tick(); // Wait for async operations (service call)

      expect(mockShoppingCartService.addItem).toHaveBeenCalledWith('Eggs', 12);
      expect(component.isAddingItem).toBeFalse(); // Should reset after call
      expect(component.showAddItemForm).toBeFalse(); // Should close modal
    }));

    it('should show error and not call service on invalid add submission', fakeAsync(() => {
      component.newItemName = ''; // Invalid name
      component.newItemQuantity = 1;
      component.onAddItemSubmit();
      expect(mockShoppingCartService.addItem).not.toHaveBeenCalled();
      expect(component.error).toContain('valid item name and quantity');
      tick(3000); // Wait for error timeout
      expect(component.error).toBeNull();
    }));

    it('should show error if addItem service call fails', fakeAsync(() => {
      const errorMsg = 'Failed to add';
      mockShoppingCartService.addItem.and.returnValue(throwError(() => new Error(errorMsg)));
      component.newItemName = 'Butter';
      component.newItemQuantity = 1;
      component.onAddItemSubmit();
      expect(mockShoppingCartService.addItem).toHaveBeenCalledWith('Butter', 1);
      expect(component.isAddingItem).toBeFalse();
      expect(component.error).toBe(errorMsg);
      tick(3000);
      expect(component.error).toBeNull();
    }));
  });

  // --- Edit Item Tests ---
  describe('Edit Item', () => {
    const itemToEdit = mockItems[0];

    it('should open the edit modal and populate fields', () => {
      component.openEditModal(itemToEdit);
      expect(component.showEditForm).toBeTrue();
      expect(component.editingItem).toBe(itemToEdit);
      expect(component.editItemName).toBe(itemToEdit.item_name);
      expect(component.editItemQuantity).toBe(itemToEdit.quantity);
    });

    it('should close the edit modal and reset fields', () => {
      component.openEditModal(itemToEdit); // Open first
      component.closeEditModal();
      expect(component.showEditForm).toBeFalse();
      expect(component.editingItem).toBeNull();
      expect(component.editItemName).toBe('');
      expect(component.editItemQuantity).toBe(1);
    });

    it('should call shoppingCartService.updateItem on valid edit submission', () => {
      component.openEditModal(itemToEdit);
      component.editItemName = 'Organic Milk';
      component.editItemQuantity = 2;
      component.onEditSubmit();
      expect(mockShoppingCartService.updateItem).toHaveBeenCalledWith(itemToEdit.id, 'Organic Milk', 2);
      expect(component.isUpdatingItem).toBeFalse(); // Should reset
      expect(component.showEditForm).toBeFalse(); // Should close modal
    });

    it('should show error and not call service on invalid edit submission', fakeAsync(() => {
      component.openEditModal(itemToEdit);
      component.editItemName = ''; // Invalid name
      component.onEditSubmit();
      expect(mockShoppingCartService.updateItem).not.toHaveBeenCalled();
      expect(component.error).toContain('valid item name and quantity');
      tick(3000);
      expect(component.error).toBeNull();
    }));

     it('should show error if updateItem service call fails', fakeAsync(() => {
      const errorMsg = 'Update failed';
      mockShoppingCartService.updateItem.and.returnValue(throwError(() => new Error(errorMsg)));
      component.openEditModal(itemToEdit);
      component.editItemName = 'Almond Milk';
      component.onEditSubmit();
      expect(mockShoppingCartService.updateItem).toHaveBeenCalled();
      expect(component.isUpdatingItem).toBeFalse();
      expect(component.error).toBe(errorMsg);
      tick(3000);
      expect(component.error).toBeNull();
    }));
  });

  // --- Delete Item Tests ---
  describe('Delete Item', () => {
    const itemToDelete = mockItems[1];

    it('should call shoppingCartService.deleteItem', () => {
      component.deleteItem(itemToDelete.id);
      expect(mockShoppingCartService.deleteItem).toHaveBeenCalledWith(itemToDelete.id);
    });

    it('should show error if deleteItem service call fails', fakeAsync(() => {
       const errorMsg = 'Delete failed';
      mockShoppingCartService.deleteItem.and.returnValue(throwError(() => new Error(errorMsg)));
      component.deleteItem(itemToDelete.id);
      expect(mockShoppingCartService.deleteItem).toHaveBeenCalledWith(itemToDelete.id);
      expect(component.error).toBe(errorMsg);
      tick(3000);
      expect(component.error).toBeNull();
    }));
  });

  // --- Add to Pantry Tests ---
  describe('Add to Pantry', () => {
    const itemToAddToPantry = mockItems[0]; // Milk

    beforeEach(() => {
      // Reset mocks for each test in this block
      mockPantryService.addItem.calls.reset();
      mockShoppingCartService.deleteItem.calls.reset();
      mockPantryService.addItem.and.returnValue(of({ status: 'success', message: 'Added to pantry' }));
      mockShoppingCartService.deleteItem.and.returnValue(of({ status: 'success', message: 'Deleted from cart' }));
    });

    it('should open Add to Pantry modal and set item', () => {
      component.openAddToPantryModal(itemToAddToPantry);
      expect(component.showAddToPantryModal).toBeTrue();
      expect(component.itemForPantryModal).toBe(itemToAddToPantry);
      expect(component.pantryCategory).toBe('');
      expect(component.pantryExpiryDate).toBe('');
    });

     it('should close Add to Pantry modal and reset fields', () => {
      component.openAddToPantryModal(itemToAddToPantry); // Open first
      component.closeAddToPantryModal();
      expect(component.showAddToPantryModal).toBeFalse();
      expect(component.itemForPantryModal).toBeNull();
      expect(component.pantryCategory).toBe('');
      expect(component.pantryExpiryDate).toBe('');
      expect(component.addToPantryModalError).toBeNull();
     });

    it('should call pantryService.addItem and shoppingCartService.deleteItem on confirm', fakeAsync(() => {
      const category = 'Dairy';
      const expiry = '2024-12-31';
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = category;
      component.pantryExpiryDate = expiry;

      component.confirmAddToPantry();
      tick(); // Allow async operations like date parsing and observable chain to resolve

      // Verify pantryService call
      expect(mockPantryService.addItem).toHaveBeenCalledTimes(1);
      const pantryArgs = mockPantryService.addItem.calls.mostRecent().args[0];
      expect(pantryArgs.name).toBe(itemToAddToPantry.item_name);
      expect(pantryArgs.quantity).toBe(itemToAddToPantry.quantity);
      expect(pantryArgs.category).toBe(category);
      expect(pantryArgs.group_name).toBe('TestGroup');
      expect(pantryArgs.expiration_date).toBeDefined(); // Check expiry was processed
      // Verify the date part in UTC, ignoring the exact time due to timezone variations
      const expiryDateUTC = new Date(pantryArgs.expiration_date);
      expect(expiryDateUTC.getUTCFullYear()).toBe(2024);
      expect(expiryDateUTC.getUTCMonth()).toBe(11); // Month is 0-indexed (11 = December)
      expect(expiryDateUTC.getUTCDate()).toBe(31);

      // Verify shoppingCartService call
      expect(mockShoppingCartService.deleteItem).toHaveBeenCalledWith(itemToAddToPantry.id);

      // Verify modal closed and state reset
      expect(component.showAddToPantryModal).toBeFalse();
      expect(component.isAddingToPantryInModal).toBeFalse();
    }));

    it('should show error if category is missing on confirm', fakeAsync(() => {
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = ''; // Missing category
      component.confirmAddToPantry();

      expect(mockPantryService.addItem).not.toHaveBeenCalled();
      expect(mockShoppingCartService.deleteItem).not.toHaveBeenCalled();
      expect(component.addToPantryModalError).toContain('Please enter a category');
      expect(component.showAddToPantryModal).toBeTrue(); // Modal should stay open

      tick(3000);
      expect(component.addToPantryModalError).toBeNull();
    }));

    it('should show error if user/group info is missing', fakeAsync(() => {
      mockApiService.getCurrentUser.and.returnValue(null); // Simulate user not logged in
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = 'Dairy';
      component.confirmAddToPantry();

      expect(mockPantryService.addItem).not.toHaveBeenCalled();
      expect(component.addToPantryModalError).toContain('Could not find user group information');
       tick(3000);
      expect(component.addToPantryModalError).toBeNull();
    }));

    it('should show error if pantryService.addItem fails', fakeAsync(() => {
      const errorMsg = 'Pantry add failed';
      mockPantryService.addItem.and.returnValue(throwError(() => new Error(errorMsg)));
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = 'Dairy';
      component.confirmAddToPantry();
      tick();

      expect(mockPantryService.addItem).toHaveBeenCalled();
      expect(mockShoppingCartService.deleteItem).not.toHaveBeenCalled(); // Should not delete if pantry add fails
      expect(component.addToPantryModalError).toBe(errorMsg);
      expect(component.isAddingToPantryInModal).toBeFalse();
      expect(component.showAddToPantryModal).toBeTrue(); // Keep modal open
    }));

    it('should show error if shoppingCartService.deleteItem fails after pantry add', fakeAsync(() => {
       const errorMsg = 'Cart delete failed';
       mockShoppingCartService.deleteItem.and.returnValue(throwError(() => new Error(errorMsg)));
       component.openAddToPantryModal(itemToAddToPantry);
       component.pantryCategory = 'Dairy';
       component.confirmAddToPantry();
       tick();

       expect(mockPantryService.addItem).toHaveBeenCalled();
       expect(mockShoppingCartService.deleteItem).toHaveBeenCalledWith(itemToAddToPantry.id);
       expect(component.addToPantryModalError).toBe(errorMsg); // Error should be from delete
       expect(component.isAddingToPantryInModal).toBeFalse();
       expect(component.showAddToPantryModal).toBeTrue(); // Keep modal open
    }));

     it('should handle adding to pantry without an expiry date', fakeAsync(() => {
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = 'Dairy';
      component.pantryExpiryDate = ''; // No expiry date provided

      component.confirmAddToPantry();
      tick();

      expect(mockPantryService.addItem).toHaveBeenCalledTimes(1);
      const pantryArgs = mockPantryService.addItem.calls.mostRecent().args[0];
      expect(pantryArgs.expiration_date).toBeUndefined(); // Expect expiry date to be undefined
      expect(mockShoppingCartService.deleteItem).toHaveBeenCalledWith(itemToAddToPantry.id);
      expect(component.showAddToPantryModal).toBeFalse();
    }));

     it('should show error for invalid expiry date format', fakeAsync(() => {
      component.openAddToPantryModal(itemToAddToPantry);
      component.pantryCategory = 'Dairy';
      component.pantryExpiryDate = 'invalid-date'; // Invalid date

      component.confirmAddToPantry();
      tick();

      expect(mockPantryService.addItem).not.toHaveBeenCalled();
      expect(mockShoppingCartService.deleteItem).not.toHaveBeenCalled();
      expect(component.addToPantryModalError).toContain('Invalid expiry date format');
      expect(component.isAddingToPantryInModal).toBeFalse();
      expect(component.showAddToPantryModal).toBeTrue(); // Keep modal open
    }));
  });
});
