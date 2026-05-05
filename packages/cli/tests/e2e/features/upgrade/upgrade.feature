@upgrade
Feature: Upgrade Command
  As a user
  I want to upgrade graphify and refresh templates
  So my brain has the latest features

  Scenario: Upgrade shows brain resolution
    Given I have a brain named "upgrade-brain" with templates
    When I run the upgrade command for "upgrade-brain"
    Then the command should attempt to upgrade

  Scenario: Upgrade rejects unknown brain
    Given I have a brain named "known-brain"
    When I run the upgrade command for "unknown-brain"
    Then the command should fail with brain not found

  Scenario: Upgrade shows help
    When I run upgrade with --help
    Then the command should succeed
    And the output should describe the upgrade command
