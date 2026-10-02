describe('deputy election setup', () => {
  it('shows the election and preserves the commission hierarchy when searching for a station', () => {
    cy.visit('/');
    cy.contains('Депутатские выборы 2026').click();
    cy.get('input[aria-label="Найти УИК"]').type('2909');
    cy.contains('ИКСРФ · Избирательная комиссия Тюменской области').should('be.visible');
    cy.contains('ОИК · Восточный г. Тюмени').should('be.visible');
    cy.contains('ТИК · Восточная ТИК-22').should('be.visible');
    cy.contains('УИК №2909').should('be.visible');
    cy.get('input[aria-label="Найти УИК"]').clear().type('2917');
    cy.contains('УИК №2917').should('be.visible');
    cy.contains('Муниципальные выборы 2026').should('not.exist');
  });
});

