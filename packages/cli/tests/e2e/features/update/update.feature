@update
Feature: Update Command
  As a user
  I want to rebuild my knowledge graph
  So my brain stays up to date

  Scenario: Update fails gracefully without Python
    Given I have a brain named "update-brain" with notes
    When I run the update command for "update-brain"
    Then the command should report failure
    And the output should indicate venv or Python issue

  Scenario: Update shows help message
    Given I have a brain named "help-brain"
    When I run update with --help
    Then the command should succeed
    And the output should describe the update command
