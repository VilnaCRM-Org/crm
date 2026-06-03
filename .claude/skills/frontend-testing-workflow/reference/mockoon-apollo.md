# Mockoon And Apollo

## E2E Mocking

Playwright E2E tests use Mockoon responses from `docker-compose.test.yml`.
Keep scenario data explicit so failures can be reproduced.

## Apollo Mock Server

Apollo server tests run in the node Jest environment. Use server tests when
changing schema loading, resolvers, or local GraphQL behavior.

## Rule

Do not hide application bugs by changing mocks first. Confirm the expected API
shape before updating mock data.
