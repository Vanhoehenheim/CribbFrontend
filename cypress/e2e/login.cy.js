describe('Checking Login Up button', () => {
  it('Checks if clicking on the login up buttons opens Login page', () => {
    cy.visit("/")
    cy.get('button').contains('Login').click()
    cy.url().should('include', '/login')
    cy.get('h1').should('contain', 'LOGIN')
  })
});

describe('Login Page Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.get('input[formControlName="username"]')
      .parent()
      .parent()
      .find('.text-red-500')
      .should('contain', 'Username is required');
    cy.get('input[formControlName="password"]')
      .parent()
      .parent()
      .find('.text-red-500')
      .should('contain', 'Password is required');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('input[formControlName="username"]').type('asdfgh');
    cy.get('input[formControlName="password"]').type('asdfghjkl1');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should display error for invalid credentials', () => {
    cy.get('input[formControlName="username"]').type('invalidUser');
    cy.get('input[formControlName="password"]').type('invalidPassword');
    cy.get('button[type="submit"]').click();
    cy.get('.text-red-500').should('contain', 'Login failed. Please check your credentials and try again.');
  });

  it('should toggle password visibility', () => {
    cy.get('input[formControlName="password"]').as('passwordInput');
    // Check initial state is password (hidden)
    cy.get('@passwordInput').should('have.attr', 'type', 'password');
    
    // Click the eye icon to show password
    cy.get('button.absolute.right-4').click();
    cy.get('@passwordInput').should('have.attr', 'type', 'text');
    
    // Click again to hide password
    cy.get('button.absolute.right-4').click();
    cy.get('@passwordInput').should('have.attr', 'type', 'password');
  });

  it('should display validation error for short password', () => {
    cy.get('input[formControlName="username"]').type('johndoe');
    cy.get('input[formControlName="password"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.get('input[formControlName="password"]')
      .parent()
      .parent()
      .find('.text-red-500')
      .should('contain', 'Password must be at least 6 characters');
  });

  it('should display server error message for failed login', () => {
    cy.get('input[formControlName="username"]').type('johndoe');
    cy.get('input[formControlName="password"]').type('WrongPassword');
    cy.get('button[type="submit"]').click();
    cy.get('.text-red-500').should('contain', 'Login failed. Please check your credentials and try again.');
  });

  it('should disable submit button while loading', () => {
    // Intercept the login API call to delay it
    cy.intercept('POST', '**/login', (req) => {
      req.reply({ delay: 1000, statusCode: 200, body: { token: 'fake-token' } });
    }).as('loginRequest');

    cy.get('input[formControlName="username"]').type('johndoe');
    cy.get('input[formControlName="password"]').type('Password123');
    cy.get('button[type="submit"]').click();
    cy.get('button[type="submit"]').should('be.disabled');
  });

});