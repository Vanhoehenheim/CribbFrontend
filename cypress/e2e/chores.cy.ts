describe('Chores Component Tests', () => {
  beforeEach(() => {
    // Visit the login page and log in with test credentials
    cy.visit('/login');
    cy.get('input[formControlName="username"]').type('asdfgh');
    cy.get('input[formControlName="password"]').type('asdfghjkl1');
    cy.get('button[type="submit"]').click();
    
    // Wait to be redirected to dashboard
    cy.url().should('include', '/dashboard');
    
    // Navigate to chores page
    cy.contains('Chores').click();
    cy.url().should('include', '/dashboard/chores');
    
    // Wait for chores to load
    cy.get('h2').contains('Group Chores').should('be.visible');
  });

  it('should display chores list and tabs', () => {
    // Verify the main elements are present
    cy.get('h2').contains('Group Chores').should('be.visible');
    cy.get('button').contains('+ Add Chore').should('be.visible');
    
    // Verify tabs are present
    cy.contains('All Chores').should('be.visible');
    cy.contains('Your Chores').should('be.visible');
    cy.contains('Overdue').should('be.visible');
    cy.contains('Completed').should('be.visible');
    
    // Click through tabs to verify they respond
    cy.contains('Your Chores').click();
    cy.contains('Overdue').click();
    cy.contains('Completed').click();
    cy.contains('All Chores').click();
  });

  it('should open and close new chore form', () => {
    // Open form
    cy.get('button').contains('+ Add Chore').click();
    cy.contains('Add New Chore').should('be.visible');
    
    // Toggle between Individual and Recurring
    cy.contains('Individual Chore').should('have.class', 'bg-blue-500');
    cy.contains('Recurring Chore').click();
    cy.contains('Recurring Chore').should('have.class', 'bg-blue-500');
    cy.contains('Individual Chore').click();
    cy.contains('Individual Chore').should('have.class', 'bg-blue-500');
    
    // Close form using Cancel button
    cy.get('button').contains('Cancel').click();
    cy.contains('Add New Chore').should('not.exist');
  });

  it('should create a new individual chore', () => {
    // Open form
    cy.get('button').contains('+ Add Chore').click();
    
    // Fill in the individual chore form
    const choreTitle = 'Test Chore ' + Date.now();
    cy.get('input[placeholder="e.g. Clean Kitchen"]').type(choreTitle);
    cy.get('textarea[placeholder="Describe what needs to be done"]').type('This is a test chore created by Cypress');
    
    // Select a roommate (first one in the dropdown)
    cy.get('select').eq(0).select(1);
    
    // Set due date (today + 1 day)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];
    cy.get('input[type="date"]').type(formattedDate);
    
    // Set points
    cy.get('input[type="number"]').clear().type('8');
    
    // Submit the form
    cy.get('button').contains('Create Chore').click();
    
    // Verify the new chore appears in the list
    cy.contains(choreTitle).should('be.visible');
    
    // Cleanup: Delete the chore that was just created
    cy.contains(choreTitle)
      .parents('.hover\\:bg-gray-50')
      .find('button')
      .contains('Delete')
      .click();
    
    // Verify the chore is no longer in the list
    cy.contains(choreTitle).should('not.exist');
  });

  it('should create a new recurring chore', () => {
    // Open form
    cy.get('button').contains('+ Add Chore').click();
    
    // Switch to recurring chore tab
    cy.contains('Recurring Chore').click();
    
    // Fill in the recurring chore form
    const recurringTitle = 'Recurring Test ' + Date.now();
    cy.get('input[placeholder="e.g. Take Out Trash"]').type(recurringTitle);
    cy.get('textarea[placeholder="Describe what needs to be done"]').type('This is a test recurring chore');
    
    // Select frequency
    cy.get('select').select('weekly');
    
    // Set points
    cy.get('input[type="number"]').clear().type('5');
    
    // Submit the form
    cy.get('button').contains('Create Chore').click();
    
    // Verify the new recurring chore appears in the list
    cy.contains(recurringTitle).should('be.visible');
    cy.contains('recurring').should('be.visible');
    
    // Cleanup: Delete the recurring chore that was just created
    cy.contains(recurringTitle)
      .parents('.hover\\:bg-gray-50')
      .find('button')
      .contains('Delete')
      .click();
    
    // Verify the recurring chore is no longer in the list
    cy.contains(recurringTitle).should('not.exist');
  });
  it('should complete a chore if it belongs to current user', () => {
    // Switch to "Your Chores" tab to find chores assigned to current user
    cy.contains('Your Chores').click();
    
    // Check if there's any chore assigned to the current user
    cy.get('body').then(($body) => {
      // If "Your Turn" badge is found, it means there's at least one chore assigned to current user
      if ($body.find('.bg-blue-400:contains("Your Turn")').length > 0) {
        // Get the title of the first chore in "Your Chores" tab
        cy.get('.divide-y.divide-gray-200 > div')
          .first()
          .find('h3')
          .invoke('text')
          .as('choreTitle')
          .then((choreTitle) => {
            // Click the "Mark Complete" button
            cy.get('.divide-y.divide-gray-200 > div')
              .first()
              .contains('Mark Complete')
              .click();
            
            // Switch to completed tab
            cy.contains('Completed').click();
            
            // Verify the chore appears in the completed list (with strikethrough)
            cy.get('.line-through').contains(choreTitle.trim()).should('be.visible');
          });
      } else {
        // Skip the test if no chores are assigned to the user
        cy.log('No chores assigned to current user found, skipping completion test');
      }
    });
  });

  it('should postpone a chore if it belongs to current user', () => {
    // Switch to "Your Chores" tab
    cy.contains('Your Chores').click();
    
    // Check if there's any chore assigned to the current user
    cy.get('body').then(($body) => {
      if ($body.find('.bg-blue-400:contains("Your Turn")').length > 0) {
        // Get the due date of the first chore
        cy.get('.divide-y.divide-gray-200 > div')
          .first()
          .contains(/Due: /)
          .invoke('text')
          .as('originalDueDate');
        
        // Click the "Postpone" button
        cy.get('.divide-y.divide-gray-200 > div')
          .first()
          .contains('Postpone')
          .click();
        
        // Verify the due date has changed (postponed)
        cy.get('@originalDueDate').then((originalDueDate) => {
          cy.get('.divide-y.divide-gray-200 > div')
            .first()
            .contains(/Due: /)
            .invoke('text')
            .should('not.eq', originalDueDate);
        });
      } else {
        // Skip the test if no chores are assigned to the user
        cy.log('No chores assigned to current user found, skipping postpone test');
      }
    });
  });
});