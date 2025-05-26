describe('Pantry Management Tests', () => {
  // Test credentials from requirements
  const testUsername = 'asdfgh';
  const testPassword = 'asdfghjkl1';
  
  // Test data for pantry items
  const testItem = {
    name: 'Test Milk',
    quantity: 2,
    unit: 'gallons',
    category: 'Dairy'
  };
  
  const updatedQuantity = 3;
  
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
  });
  
  it('should navigate to pantry section and verify UI elements', () => {
    // Navigate to pantry section using the sidebar
    cy.contains('Pantry').click();
    cy.url().should('include', '/dashboard/pantry');
    
    // Verify pantry UI elements
    cy.contains('Pantry Management').should('be.visible');
    cy.get('button.bg-white.text-blue-500').should('be.visible');
    
    // Verify category filters section exists
    cy.contains('All Items').should('be.visible');
  });
  
  it('should add a new pantry item', () => {
    // Navigate to pantry section
    cy.contains('Pantry').click();
    
    // Make sure no modals are open by checking first
    cy.get('body').then($body => {
      if ($body.find('.fixed.inset-0.bg-black.bg-opacity-50').length > 0) {
        // If a modal is open, close it by clicking the X button
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50')
          .find('button:visible')
          .first()
          .click();
      }
    });
    
    // Wait for a moment to ensure any animations complete
    cy.wait(500);
    
    // Click on Add Item button - target it by both text content and class
    cy.get('button.bg-white.text-blue-500').contains('Add Item').as('addItemBtn');
    cy.get('@addItemBtn').click({ force: true });
    
    // Verify modal opens
    cy.contains('Add New Pantry Item').should('be.visible');
    
    // Fill the form with test data
    cy.get('#name').type(testItem.name);
    cy.get('#quantity').type(testItem.quantity.toString());
    cy.get('#unit').type(testItem.unit);
    cy.get('#category').type(testItem.category);
    
    // Set expiration date to 7 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const formattedDate = expiryDate.toISOString().split('T')[0];
    cy.get('#expiration_date').type(formattedDate);
    
    // Submit the form - target the form submission button specifically by its class and type
    cy.get('button[type="submit"].w-full.bg-blue-500').as('submitBtn');
    cy.get('@submitBtn').click({ force: true });
    
    // Verify success message appears (the form should close automatically)
    cy.contains('Add New Pantry Item').should('not.exist');
    
    // Verify the new item appears in the list - check only for name and category
    cy.contains(testItem.name).should('be.visible');
    cy.contains(testItem.category).should('be.visible');
  });
  
  it('should update quantity and expiration date of a pantry item', () => {
    // Navigate to pantry section
    cy.contains('Pantry').click();
    
    // Make sure no modals are open by checking first
    cy.get('body').then($body => {
      if ($body.find('.fixed.inset-0.bg-black.bg-opacity-50').length > 0) {
        // If a modal is open, close it by clicking the X button
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50')
          .find('button:visible')
          .first()
          .click();
        // Wait for modal to close
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50').should('not.exist');
      }
    });
    
    // Wait for a moment to ensure any animations complete
    cy.wait(500);
    
    // Ensure our test item exists (from previous test)
    // If not found, we'll add it first
    cy.get('body').then($body => {
      if (!$body.text().includes(testItem.name)) {
        // Add the test item if not found
        cy.get('button.bg-white.text-blue-500').contains('Add Item').click({ force: true });
        cy.get('#name').type(testItem.name);
        cy.get('#quantity').type(testItem.quantity.toString());
        cy.get('#unit').type(testItem.unit);
        cy.get('#category').type(testItem.category);
        
        // Submit the form using the correct form submission button
        cy.get('button[type="submit"].w-full.bg-blue-500').click({ force: true });
        
        // Wait for item to appear in the list
        cy.contains(testItem.name).should('be.visible');
      }
    });
    
    // Find the item and store reference to its container for future use
    cy.contains(testItem.name).parents('.rounded-lg').first().as('itemCard');
    
    // Click the update button
    cy.get('@itemCard').contains('Update').click({ force: true });
    
    // Verify update modal opens
    cy.contains('Update Item Details').should('be.visible');
    
    // Update the quantity
    cy.get('input[type="number"]').clear().type(updatedQuantity.toString());
    
    // Update the expiration date to 14 days from now
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 14);
    const formattedNewDate = newExpiryDate.toISOString().split('T')[0];
    cy.get('input[type="date"]').clear().type(formattedNewDate);
    
    // Save the changes
    cy.contains('button', 'Save Changes').click();
    
    // Verify the modal closes
    cy.contains('Update Item Details').should('not.exist');
    
    // Verify the item still exists after update
    cy.contains(testItem.name).should('be.visible');
  });
  
  it('should use a quantity of a pantry item', () => {
    // Navigate to pantry section
    cy.contains('Pantry').click();
    
    // Make sure no modals are open
    cy.get('body').then($body => {
      if ($body.find('.fixed.inset-0.bg-black.bg-opacity-50').length > 0) {
        // If a modal is open, close it
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50')
          .find('button:visible')
          .first()
          .click();
      }
    });
    
    // Wait for a moment to ensure any animations complete
    cy.wait(500);
    
    // Find our test item and store reference to its container
    cy.contains(testItem.name).parents('.rounded-lg').first().as('itemCard');
    
    // Click the Use button without checking quantity
    cy.get('@itemCard').contains('Use').click({ force: true });
    
    // Verify the item still exists after using
    cy.contains(testItem.name).should('be.visible');
  });
  
  it('should delete all pantry items', () => {
    // Navigate to pantry section
    cy.contains('Pantry').click();
    
    // Make sure no modals are open
    cy.get('body').then($body => {
      if ($body.find('.fixed.inset-0.bg-black.bg-opacity-50').length > 0) {
        // If a modal is open, close it
        cy.get('.fixed.inset-0.bg-black.bg-opacity-50')
          .find('button:visible')
          .first()
          .click();
      }
    });
    
    // Wait for a moment to ensure any animations complete
    cy.wait(500);
    
    // Check if there are any pantry items
    cy.get('body').then(($body) => {
      // If we have the empty state message, no need to delete anything
      if ($body.text().includes('No items found in your pantry')) {
        cy.log('No items to delete - pantry is already empty');
        return;
      }
      
      // Otherwise, get all items and delete them one by one
      cy.get('.grid > div').each(($item, index) => {
        // Store current item for deletion (using first to ensure we're working with the top item)
        cy.wrap($item).first().as('currentItem');
        
        // Click the Delete button on this item
        cy.get('@currentItem').contains('Delete').click({ force: true });
        
        // Wait for deletion to complete
        cy.wait(300);
      });
      
      // After attempting to delete all items, verify pantry is empty
      cy.contains('No items found in your pantry').should('be.visible');
    });
  });

});