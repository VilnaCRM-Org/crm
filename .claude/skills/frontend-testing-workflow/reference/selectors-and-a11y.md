# Selectors And Accessibility

## Locator Priority

1. Role and accessible name.
2. Label text.
3. Visible text.
4. Test ID for controls without stable semantic names.

## Accessibility Pressure

Tests should make inaccessible UI harder to ship. If a button cannot be selected
by role and name, check whether the component needs an accessible label.
