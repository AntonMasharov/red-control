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

describe('observer workflows and persisted records', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.contains('Депутатские выборы 2026').click();
    cy.get('input[aria-label="Найти УИК"]').type('2909');
    cy.contains('УИК · УИК №2909').click();
    cy.get('input[aria-label="Ваши фамилия, имя, отчество"]').type('Тестовый наблюдатель');
    cy.contains('Сохранить выбор').click();
    cy.get('[aria-label="Закрыть окно"]').click();
  });

  it('preserves station and turnout after reloading the built application', () => {
    cy.get('[aria-label="Добавить одного человека"]').click().click();
    cy.get('[aria-label="Явка 2. Открыть подробности"]').should('be.visible');
    cy.reload();
    cy.get('[aria-label="Явка 2. Открыть подробности"]').should('be.visible').click();
    cy.contains('История').should('be.visible');
    cy.get('[aria-label="Закрыть окно"]').click();
    cy.get('[aria-label="Мой участок"]').click();
    cy.contains('УИК № 2909').should('be.visible');
  });

  it('adds a personal contact and retains it on reload', () => {
    cy.contains('Штаб').filter(':visible').click();
    cy.contains('Добавить контакт').click();
    cy.get('input[aria-label="Имя"]').type('Тестовый юрист');
    cy.get('input[aria-label="Телефон"]').type('89991234567');
    cy.contains('Сохранить контакт').click();
    cy.contains('Тестовый юрист').should('be.visible');
    cy.reload();
    cy.contains('Штаб').filter(':visible').click();
    cy.contains('Тестовый юрист').should('be.visible');
  });
});
