@status
Feature: Status Command
  As a user
  I want to see the status of my brain
  So I can check its configuration

  Scenario: Status shows brain information
    Given I have a brain named "my-brain"
    When I run the status command for "my-brain"
    Then the command should succeed
    And the output should contain "Tool version:"

  Scenario: Status shows brain path
    Given I have a brain named "work-brain"
    When I run the status command for "work-brain"
    Then the command should succeed
    And the output should contain "Brain path:"
