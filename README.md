[![SWUbanner](./public/supportUkraine.svg)](https://supportukrainenow.org/)

# Template for modern SPA applications

[![CodeScene Code Health](https://codescene.io/projects/43862/status-badges/code-health)](https://codescene.io/projects/43862)
[![CodeScene System Mastery](https://codescene.io/projects/43862/status-badges/system-mastery)](https://codescene.io/projects/43862)
[![codecov](https://codecov.io/gh/VilnaCRM-Org/frontend-spa-template/graph/badge.svg?token=iV60KVUVxQ)](https://codecov.io/gh/VilnaCRM-Org/frontend-spa-template)

## Possibilities

- Modern JavaScript stack for services: [React](https://react.dev/), [Next.js](https://nextjs.org/)
- A lot of CI checks to ensure the highest code quality that can be
  (Security checks, Code style fixer, static linters, DeepScan, Snyk)
- Configured testing tools: [Cypress](https://www.cypress.io/), [Jest](https://jestjs.io/)
- This template is based on [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master)
- Much more!

## Why you might need it

Many front-end developers need to create new projects from scratch and spend a lot of time.

We decided to simplify this exhausting process and create a public template for modern
front-end applications. This template is used for all our microservices in VilnaCRM.

## License

This software is distributed under the
[Creative Commons Zero v1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/deed) license.
Please read [LICENSE](https://github.com/VilnaCRM-Org/frontend-spa-template/blob/main/LICENSE) for information
on the software availability and distribution.

### Minimal installation

You can clone this repository locally or use Github functionality "Use this template"

Install [node.js](https://nodejs.org/en/) and [pnpm](https://pnpm.io/)

Use pnpm install for installing all dependencies and pnpm run dev for running application

## Using

The list of possibilities

```bash
pnpm run dev - starts application
pnpm run build - build application
pnpm lint:next - static next lint
pnpm lint:tsc - static TypeScript lint
pnpm test:e2e - end-to-end testing
pnpm test:e2e:local - open GUI with list of end-to-end test
pnpm test:unit - unit testing
pnpm lighthouse:desktop - lighthouse desktop testing
pnpm lighthouse:mobile - lighthouse mobile tesitng
```

## Routing

This project includes a routing script for managing URLs.
The routing script maps requests to the correct HTML files, ensuring proper navigation.
For detailed information, check the [routing script](scripts/cloudfront_routing.js).

### How It Works

- Mapping: Specific URL paths are mapped to corresponding HTML files.
- Fallback Logic: For undefined routes, the script appends /index.html to handle directory-like paths.
- Error Handling: If an error occurs, the script logs it and returns the original request.

This routing logic is useful for SSR (Server-Side Rendered) applications,
particularly when hosted on platforms like AWS CloudFront.

## Documentation

Start reading at the [GitHub wiki](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki).
If you're having trouble, head for
[the troubleshooting guide](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki/Troubleshooting)
as it's frequently updated.

You can generate complete API-level documentation by running `doc` in the top-level
folder, and documentation will appear in the `docs` folder, though you'll need to have
[API-Extractor](https://api-extractor.com/) installed.

If the documentation doesn't cover what you need, search the
[many questions on Stack Overflow](http://stackoverflow.com/questions/tagged/vilnacrm),
and before you ask a question,
[read the troubleshooting guide](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki/Troubleshooting).

## Tests

[Tests](https://github.com/VilnaCRM-Org/frontend-spa-template/actions)

If this isn't passing, is there something you can do to help?

## Security

Please disclose any vulnerabilities found responsibly – report security issues to the maintainers privately.

See
[SECURITY](https://github.com/VilnaCRM-Org/frontend-spa-template/tree/main/SECURITY.md)
and
[Security advisories on GitHub](https://github.com/VilnaCRM-Org/frontend-spa-template/security).

## Contributing

Please submit bug reports, suggestions, and pull requests to the
[GitHub issue tracker](https://github.com/VilnaCRM-Org/frontend-spa-template/issues).

We're particularly interested in fixing edge cases, expanding test coverage,
and updating translations.

If you found a mistake in the docs, or want to add something, go ahead and
amend the wiki – anyone can edit it.

## Sponsorship

Development time and resources for this repository are provided by
[VilnaCRM](https://vilnacrm.com/),
the free and opensource CRM system.

Donations are very welcome, whether in beer 🍺, T-shirts 👕, or cold, hard cash 💰.
Sponsorship through GitHub is a simple and convenient way to say "thank you" to
maintainers and contributors – just click the "Sponsor" button
[on the project page](https://github.com/VilnaCRM-Org/frontend-spa-template).
If your company uses this template, consider taking part in the VilnaCRM's enterprise support program.

## Changelog

See [changelog](CHANGELOG.md).
