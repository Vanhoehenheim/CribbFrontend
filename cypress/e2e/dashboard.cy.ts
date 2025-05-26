describe('Dashboard Page Tests', () => {
  // Utility function to mock successful login
  beforeEach(() => {
    // Mock the auth token for authenticated requests
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'fake-test-token');
      win.localStorage.setItem('user_data', JSON.stringify({
        id: '12345',
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        roomNo: '101',
        groupName: 'Test Group',
        groupCode: 'TEST123'
      }));
    });
  });

  afterEach(() => {
    // Clean up local storage after each test
    cy.window().then((win) => {
      win.localStorage.removeItem('auth_token');
      win.localStorage.removeItem('user_data');
    });
  });

  it('should redirect to login page when not authenticated', () => {
    // Clear the auth token to simulate logged out state
    cy.window().then((win) => {
      win.localStorage.removeItem('auth_token');
      win.localStorage.removeItem('user_data');
    });
    
    // Visit dashboard and verify redirect to login
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should display loading state when fetching user data', () => {
    // Intercept the API call to getUserProfile and delay response
    cy.intercept('GET', '**/api/users/profile', (req) => {
      req.reply({ 
        delay: 1000,  // 1 second delay
        body: {
          id: '12345',
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          roomNo: '101',
          groupName: 'Test Group',
          groupCode: 'TEST123'
        }
      });
    }).as('getUserProfile');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Verify loading spinner is displayed 
    cy.get('.animate-spin').should('be.visible');
    
    // Wait for the API response to complete
    cy.wait('@getUserProfile');
    
    // Verify loading spinner is no longer visible
    cy.get('.animate-spin').should('not.exist');
  });

  it('should display user profile information correctly', () => {
    // Intercept the API call with mock data
    cy.intercept('GET', '**/api/users/profile', {
      body: {
        id: '12345',
        email: 'testuser@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '1234567890',
        roomNo: '202',
        groupName: 'Awesome Team',
        groupCode: 'TEAM123'
      }
    }).as('getUserProfile');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Wait for API response
    cy.wait('@getUserProfile');
    
    // Verify user information is displayed correctly
    cy.contains('Welcome, Jane!').should('be.visible');
    cy.contains('Group: Awesome Team').should('be.visible');
    cy.contains('Room No: 202').should('be.visible');
  });

  it('should toggle sidebar when toggle button is clicked', () => {
    // Intercept API call
    cy.intercept('GET', '**/api/users/profile', {
      body: {
        id: '12345',
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        roomNo: '101',
        groupName: 'Test Group',
        groupCode: 'TEST123'
      }
    }).as('getUserProfile');
    
    // Visit dashboard
    cy.visit('/dashboard');
    cy.wait('@getUserProfile');
    
    // Verify sidebar is initially open (showing full width)
    cy.get('.sidebar').should('have.class', 'w-64');
    
    // Click toggle button
    cy.get('.flex.justify-end.p-4 button').click();
    
    // Verify sidebar is now collapsed
    cy.get('.sidebar').should('have.class', 'w-16');
    
    // Click toggle button again
    cy.get('.flex.justify-end.p-4 button').click();
    
    // Verify sidebar is open again
    cy.get('.sidebar').should('have.class', 'w-64');
  });

  it('should navigate to Chores page when Chores link is clicked', () => {
    // Intercept API call
    cy.intercept('GET', '**/api/users/profile', {
      body: {
        id: '12345',
        firstName: 'Test',
        lastName: 'User',
        roomNo: '101',
        groupName: 'Test Group'
      }
    }).as('getUserProfile');
    
    // Intercept any API calls related to chores route
    cy.intercept('GET', '**/api/chores*', []).as('getChores');
    
    // Visit dashboard
    cy.visit('/dashboard');
    cy.wait('@getUserProfile');
    
    // Click Chores link
    cy.contains('Chores').click();
    
    // Verify URL changes
    cy.url().should('include', '/dashboard/chores');
  });

  it('should navigate to Pantry page when Pantry link is clicked', () => {
    // Intercept API call
    cy.intercept('GET', '**/api/users/profile', {
      body: {
        id: '12345',
        firstName: 'Test',
        lastName: 'User',
        roomNo: '101',
        groupName: 'Test Group'
      }
    }).as('getUserProfile');
    
    // Intercept any API calls related to pantry route
    cy.intercept('GET', '**/api/pantry*', []).as('getPantry');
    
    // Visit dashboard
    cy.visit('/dashboard');
    cy.wait('@getUserProfile');
    
    // Click Pantry link
    cy.contains('Pantry').click();
    
    // Verify URL changes
    cy.url().should('include', '/dashboard/pantry');
  });

  it('should display error message when user profile fetch fails', () => {
    // Intercept API call with error response
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 500,
      body: { message: 'Server error' }
    }).as('getUserProfileError');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Wait for API response
    cy.wait('@getUserProfileError');
    
    // Verify error message is displayed
    cy.contains('Failed to load user data').should('be.visible');
  });

  it('should redirect to login when authentication error occurs', () => {
    // Intercept API call with auth error response
    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 401,
      body: { message: 'User not authenticated' }
    }).as('getUserProfileAuthError');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Wait for API response
    cy.wait('@getUserProfileAuthError');
    
    // Verify redirection to login
    cy.url().should('include', '/login');
  });
});