@multi-brain
Feature: Multi-Brain Management
  As a power user
  I want to manage multiple brains
  So I can separate work and personal knowledge

  Scenario: Create multiple brains
    Given I am on a fresh machine
    When I run setup for brain "work-brain"
    And I run setup for brain "personal-brain"
    Then I should have two brains configured

  Scenario: List shows all brains
    Given I have a brain named "work-brain"
    And I have a brain named "personal-brain"
    When I run the list command
    Then the output should contain "work-brain"
    And the output should contain "personal-brain"

  Scenario: Status with specific brain-id
    Given I have a brain named "work-brain"
    When I run status with --brain-id work-brain
    Then the output should show work-brain path

  Scenario: Auto-detect brain from current directory
    Given I have a brain at "/tmp/test-brain"
    And I am inside the test-brain folder
    When I run status without --brain-id
    Then it should auto-detect and show test-brain status
