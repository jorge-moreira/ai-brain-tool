@templates
Feature: Templates Command
  As a user
  I want to manage custom templates
  So I can personalize my brain's note structure

  Scenario: List shows bundled and custom templates
    Given I have a brain named "tmpl-brain"
    When I run the templates list command for "tmpl-brain"
    Then the command should succeed
    And the output should contain "Markdown templates"

  Scenario: List shows empty custom message
    Given I have a brain named "empty-brain"
    When I run the templates list command for "empty-brain"
    Then the output should contain "none yet"
