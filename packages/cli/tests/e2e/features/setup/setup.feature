@setup
Feature: Setup Command
  As a new user
  I want to set up my brain
  So I can start managing my knowledge graph

  Scenario: List shows configured brains
    Given I have a brain named "test-brain"
    When I run the list command
    Then the command should succeed
    And the output should contain "test-brain"

  Scenario: Status shows brain information
    Given I have a brain named "my-brain"
    When I run the status command for "my-brain"
    Then the command should succeed
    And the output should contain "Tool version:"

  Scenario: Status shows brain path
    Given I have a brain named "work-brain"
    When I run the status command for "work-brain"
    Then the output should contain "Brain path:"
