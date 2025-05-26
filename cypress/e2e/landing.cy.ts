describe('Checking Landing Page', () => {
  it('Checks if landing page works', () => {
    cy.visit("/");
    cy.get('h1').should('contain', 'WELCOME TO'); // Verify main heading
    cy.get('button').contains('Login').should('be.visible'); // Verify Login button
    cy.get('button').contains('Sign up').should('be.visible'); // Verify Sign Up button
  });
});