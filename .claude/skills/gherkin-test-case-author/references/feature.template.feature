@feature:auth @owner:qa-platform
Feature: User authentication

  As a registered user
  I want to sign in with my credentials
  So that I can access my private dashboard

  Background:
    Given the application is reachable

  @smoke @ac:AC-1
  Scenario: Authenticated user reaches the dashboard
    Given a registered user
    When the user signs in with valid credentials
    Then the dashboard is displayed

  @ac:AC-2
  Scenario: Invalid password is rejected with a clear message
    Given a registered user
    When the user signs in with the wrong password
    Then a generic invalid-credentials message is displayed
    And the user remains on the sign-in page

  @ac:AC-3
  Scenario Outline: Locked accounts cannot sign in
    Given a registered user whose account is "<status>"
    When the user signs in with valid credentials
    Then the sign-in is denied with reason "<reason>"

    Examples:
      | status     | reason             |
      | suspended  | account-suspended  |
      | deleted    | account-not-found  |
      | unverified | email-not-verified |
