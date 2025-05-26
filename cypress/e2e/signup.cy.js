// Use dynamically generated first name, last name, username, password, group name, room number, and phone number for each test run

describe('Checking Sign Up button', () => {
  it('Checks if clicking on the sign up button opens the signup page', () => {
    cy.visit("/");
    cy.get('button').contains('Sign up').click();
    cy.url().should('include', '/signup');
    cy.get('h1').should('contain', 'SIGN UP');
  });
});

describe('Signup Page Tests', () => {
  let uniqueFirstName;
  let uniqueLastName;
  let uniqueUsername;
  let uniquePassword;
  let uniqueGroupName;
  let uniqueRoomNumber;
  let uniquePhoneNumber;

  beforeEach(() => {
    // Generate unique first name, last name, username, password, group name, room number, and phone number
    const timestamp = Date.now();
    uniqueFirstName = `First${timestamp}`;
    uniqueLastName = `Last${timestamp}`;
    uniqueUsername = `user${timestamp}`;
    uniquePassword = `Password${timestamp}`;
    uniqueGroupName = `Group${timestamp}`;
    uniqueRoomNumber = `${Math.floor(100 + Math.random() * 900)}`; // Random 3-digit room number
    uniquePhoneNumber = `${Math.floor(1000000000 + Math.random() * 9000000000)}`; // Random 10-digit phone number

    cy.visit('/signup');
  });

  it('should display validation errors for empty fields', () => {
    cy.get('button').contains('Join Group').click();
    cy.get('span').should('contain', 'First name is required');
    cy.get('span').should('contain', 'Last name is required');
    cy.get('span').should('contain', 'Username is required');
    cy.get('span').should('contain', 'Password is required');
    cy.get('span').should('contain', 'Phone number is required');
  });

  it('should validate phone number format', () => {
    cy.get('input[formControlName="phone"]').type('123');
    cy.get('button').contains('Join Group').click();
    cy.get('span').should('contain', 'Please enter a valid 10-digit phone number');
  });

  it('should validate password requirements', () => {
    cy.get('input[formControlName="password"]').type('short');
    cy.get('button').contains('Join Group').click();
    cy.get('span').should('contain', 'Password must be at least 8 characters long');
    cy.get('span').should('contain', 'Password must include at least one number');
  });

  it('should submit the form successfully for Create Group', () => {
    cy.get('input[formControlName="firstName"]').type(uniqueFirstName);
    cy.get('input[formControlName="lastName"]').type(uniqueLastName);
    cy.get('input[formControlName="username"]').type(uniqueUsername);
    cy.get('input[formControlName="password"]').type(uniquePassword);
    cy.get('input[formControlName="phone"]').type(uniquePhoneNumber);
    cy.get('button').contains('Create Group').click();

    // Wait for the modal to appear and interact with it
    cy.get('#create-modal').should('be.visible');
    cy.get('#create-modal input[formControlName="group"]').type(uniqueGroupName); // Use dynamically generated group name
    cy.get('#create-modal input[formControlName="roomNo"]').type(uniqueRoomNumber); // Use dynamically generated room number
    cy.get('#create-modal button[type="submit"]').contains('Submit').click();

    // Verify redirection to the login page
    cy.url().should('include', '/login');
  });
});