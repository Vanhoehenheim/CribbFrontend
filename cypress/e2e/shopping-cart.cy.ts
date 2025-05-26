describe('Shopping Cart Tests', () => {
  // Test credentials
  const testUsername = 'asdfgh';
  const testPassword = 'asdfghjkl1';
  
  // Test data for shopping cart items
  const testItem = {
    name: 'Test Cereal',
    quantity: 2
  };
  
  const updatedTestItem = {
    name: 'Organic Cereal',
    quantity: 3
  };
  
  // Pantry data for when adding to pantry
  const pantryDetails = {
    category: 'Breakfast Foods',
    expiryDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 3); // 3 months expiry
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    })()
  };
  
  // Helper function to check and close any open modals
  const closeAnyOpenModals = () => {
    cy.get('body').then($body => {
      // Check for any modal backdrops
      if ($body.find('.fixed.inset-0.bg-black.bg-opacity-50').length > 0) {
        // If a modal is open, close it by clicking the close button
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50')
          .find('button:visible')
          .first()
          .click({force: true});
        
        // Wait for modal to close
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50').should('not.exist');
      }
    });
  };
  
  beforeEach(() => {
    // Visit the landing page before each test
    cy.visit('/');
    cy.url().should('include', '/');
    
    // Verify landing page content
    cy.contains('WELCOME TO').should('be.visible');
    cy.contains('cribb.').should('be.visible');
    
    // Click the login button from landing page
    cy.contains('Login').click();
    cy.url().should('include', '/login');

    // Login with the provided test credentials
    cy.get('[formControlName="username"]').type(testUsername);
    cy.get('[formControlName="password"]').type(testPassword);
    cy.contains('button', 'Sign in').click();
    
    // Verify successful login by waiting for dashboard to load
    cy.url().should('include', '/dashboard');
    
    // Navigate to shopping cart section using the sidebar
    cy.contains('Shopping Cart').click();
    cy.url().should('include', '/dashboard/shopping-cart');
    
    // Close any modals that might be open from previous tests
    closeAnyOpenModals();
  });
  
  it('should navigate to shopping cart and verify UI elements', () => {
    // Verify shopping cart UI elements
    cy.contains('Shopping Cart').should('be.visible');
    cy.get('button').contains('Add Item').should('be.visible');
    
    // Check if Total Items counter is visible
    cy.contains('Total Items:').should('be.visible');
  });
  
  it('should add a new item to the shopping cart', () => {
    // Make sure no modals are open before attempting to click Add Item
    closeAnyOpenModals();
    
    // Click on Add Item button with force true to handle any potential overlay issues
    cy.contains('button', 'Add Item').click({force: true});
    
    // Verify modal opens
    cy.contains('Add New Shopping Item').should('be.visible');
    
    // Fill the form with test data
    cy.get('#itemName').should('be.visible').type(testItem.name);
    cy.get('#itemQuantity').should('be.visible').clear().type(testItem.quantity.toString());
    
    // Submit the form by clicking the Add Item button in the modal
    // Target it more specifically using type attribute and text content
    cy.get('form button[type="submit"]').contains('Add Item').click({force: true});
    
    // Verify the modal closes
    cy.contains('Add New Shopping Item').should('not.exist');
    
    // Verify the new item appears in the list
    cy.contains(testItem.name).should('be.visible');
    cy.contains(`${testItem.quantity} units`).should('be.visible');
  });
  
  it('should edit an existing item in the shopping cart', () => {
    // Make sure no modals are open
    closeAnyOpenModals();
    
    // Make sure our test item exists
    cy.get('body').then($body => {
      if (!$body.text().includes(testItem.name)) {
        // Add the test item if not found
        cy.contains('button', 'Add Item').click({force: true});
        cy.get('#itemName').type(testItem.name);
        cy.get('#itemQuantity').clear().type(testItem.quantity.toString());
        // Click the submit button in the modal form
        cy.get('form button[type="submit"]').contains('Add Item').click({force: true});
        // Wait for item to appear
        cy.contains(testItem.name).should('be.visible');
      }
    });
    
    // Find the item and click the Edit button
    cy.contains(testItem.name).parents('.bg-white.rounded-lg').first().as('itemCard');
    cy.get('@itemCard').contains('Edit').click({force: true});
    
    // Verify edit modal opens
    cy.contains('Edit Shopping Item').should('be.visible');
    
    // Update the item details
    cy.get('#editItemName').should('be.visible').clear().type(updatedTestItem.name);
    cy.get('#editItemQuantity').should('be.visible').clear().type(updatedTestItem.quantity.toString());
    
    // Save the changes - target the submit button in the form
    cy.get('form button[type="submit"]').contains('Update Item').click({force: true});
    
    // Verify the modal closes
    cy.contains('Edit Shopping Item').should('not.exist');
    
    // Verify the updated item appears in the list
    cy.contains(updatedTestItem.name).should('be.visible');
    cy.contains(`${updatedTestItem.quantity} units`).should('be.visible');
  });
  
  it('should add a cart item to the pantry', () => {
    // Make sure no modals are open
    closeAnyOpenModals();
    
    // Make sure our updated test item exists
    cy.get('body').then($body => {
      if (!$body.text().includes(updatedTestItem.name)) {
        // Add the test item if not found
        cy.contains('button', 'Add Item').click({force: true});
        cy.get('#itemName').type(updatedTestItem.name);
        cy.get('#itemQuantity').clear().type(updatedTestItem.quantity.toString());
        // Click the submit button in the modal form
        cy.get('form button[type="submit"]').contains('Add Item').click({force: true});
        // Wait for item to appear
        cy.contains(updatedTestItem.name).should('be.visible');
      }
    });
    
    // Find the item and click the Add to Pantry button
    cy.contains(updatedTestItem.name).parents('.bg-white.rounded-lg').first().as('itemCard');
    cy.get('@itemCard').contains('Add to Pantry').click({force: true});
    
    // Verify add to pantry modal opens
    cy.contains('Add to Pantry').should('be.visible');
    
    // Fill in the pantry details
    cy.get('#pantryCategory').should('be.visible').type(pantryDetails.category);
    cy.get('#pantryExpiryDate').should('be.visible').type(pantryDetails.expiryDate);
    
    // Confirm adding to pantry - target the submit button in the form
    cy.get('form button[type="submit"]').contains('Confirm Add to Pantry').click({force: true});
    
    // Wait for the modal to close - add an explicit wait here
    cy.contains('Add to Pantry', { timeout: 10000 }).should('not.exist');
    
    // Verify the item is removed from the shopping cart list
    cy.contains(updatedTestItem.name).should('not.exist');
  });
  
  it('should verify the item was added to pantry', () => {
    // Make sure no modals are open
    closeAnyOpenModals();
    
    // Navigate to the pantry section
    cy.contains('Pantry').click();
    cy.url().should('include', '/dashboard/pantry');
    
    // Verify the item exists in pantry with the correct details
    cy.contains(updatedTestItem.name).should('be.visible');
    cy.contains(pantryDetails.category).should('be.visible');
    
    // Clean up - delete the item from pantry to restore state
    cy.contains(updatedTestItem.name).parents('.rounded-lg').first().as('pantryItem');
    cy.get('@pantryItem').contains('Delete').click({force: true});
    
    // Verify item is deleted
    cy.contains(updatedTestItem.name).should('not.exist');
  });
  
  it('should delete an item from shopping cart', () => {
    // Make sure no modals are open
    closeAnyOpenModals();
    
    // Navigate back to shopping cart
    cy.contains('Shopping Cart').click();
    cy.url().should('include', '/dashboard/shopping-cart');
    
    // Make sure no modals are open again after navigation
    closeAnyOpenModals();
    
    // Add a test item to delete
    cy.contains('button', 'Add Item').click({force: true});
    cy.get('#itemName').should('be.visible').type('Item to delete');
    cy.get('#itemQuantity').should('be.visible').clear().type('1');
    
    // Click the submit button in the modal form
    cy.get('form button[type="submit"]').contains('Add Item').click({force: true});
    
    // Verify the item appears
    cy.contains('Item to delete').should('be.visible');
    
    // Delete the item
    cy.contains('Item to delete').parents('.bg-white.rounded-lg').first().as('itemToDelete');
    cy.get('@itemToDelete').contains('Delete').click({force: true});
    
    // Verify the item is removed
    cy.contains('Item to delete').should('not.exist');
  });
});