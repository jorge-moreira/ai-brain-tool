@obsidian
Feature: Setup Obsidian Command
  As a user with Obsidian
  I want to configure my vault path
  So my brain works with Obsidian

  Scenario: Show existing vault configuration
    Given I have a brain named "existing-brain" with obsidian configured
    When I run setup-obsidian for "existing-brain"
    Then the output should show current vault configuration
