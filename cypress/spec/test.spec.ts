describe('test', () => {
  it('first test', () => {
    cy.visit(Cypress.env('REACT_APP_WEBSITE_URL'));
    expect(true).to.equal(true);
  });
});
