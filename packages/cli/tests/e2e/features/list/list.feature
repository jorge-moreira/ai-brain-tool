@list
Feature: List Command
  As a user
  I want to list my configured brains
  So I can see what brains are available

  Scenario: List shows configured brains
    Given I have a brain named "test-brain"
    When I run the list command
    Then the command should succeed
    And the output should contain "test-brain"
