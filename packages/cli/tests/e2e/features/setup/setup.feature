@setup
Feature: Setup Command
  As a new user
  I want to install ai-brain dependencies
  So I can start using the tool

  Scenario: Setup installs global dependencies with --non-interactive
    Given I have no global venv installed
    When I run setup with --non-interactive
    Then the command should succeed
    And the global venv should exist
    And graphify should be installed
