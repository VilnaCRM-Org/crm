import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const MINIMUM_REMAINING_SECONDS = 3600;

const CREATE_USER = `mutation CreateUser($input: createUserInput!) {
  createUser(input: $input) { user { id } }
}`;

const SIGN_IN_USER = `mutation SignInUser($input: signInUserInput!) {
  signInUser(input: $input) { user { success twoFactorEnabled accessToken } }
}`;

export default class DemoSessionIssuer {
  constructor({ fetch, graphqlUrl, templatePath, generatedPath, demo, now = Date.now }) {
    this.fetch = fetch;
    this.graphqlUrl = graphqlUrl;
    this.templatePath = templatePath;
    this.generatedPath = generatedPath;
    this.demo = demo;
    this.now = now;
  }

  async graphql(query, input) {
    const response = await this.fetch(this.graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { input } }),
    });
    return response.json();
  }

  secondsRemaining(token) {
    const payload = token.split('.')[1] ?? '';
    const { exp = 0 } = JSON.parse(Buffer.from(payload, 'base64url').toString() || '{}');
    return exp - Math.floor(this.now() / 1000);
  }

  reusableToken() {
    if (!existsSync(this.generatedPath)) return null;
    const [response] = JSON.parse(readFileSync(this.generatedPath, 'utf8')).routes[0].responses;
    if (!response.rules.some((rule) => rule.value === this.demo.email)) return null;
    const token = JSON.parse(response.body).data.signInUser.user.accessToken;
    return this.secondsRemaining(token) > MINIMUM_REMAINING_SECONDS ? token : null;
  }

  async createdDemoUser() {
    const { email, password, name } = this.demo;
    const created = await this.graphql(CREATE_USER, {
      email,
      initials: name,
      password,
      clientMutationId: randomUUID(),
    });
    return typeof created.data?.createUser?.user?.id === 'string';
  }

  async issueToken() {
    const { email, password } = this.demo;
    const signIn = await this.graphql(SIGN_IN_USER, {
      email,
      password,
      rememberMe: true,
      clientMutationId: randomUUID(),
    });
    const token = signIn.data?.signInUser?.user?.accessToken;
    if (typeof token === 'string' && token !== '') return token;
    const reason = JSON.stringify(signIn.errors ?? signIn);
    throw new Error(
      `user-service refused the demo sign-in: ${reason}. If you changed the demo password, ` +
        'run again with LOCAL_DEMO_PASSWORD set to the new one.'
    );
  }

  writeEnvironment(token) {
    const environment = readFileSync(this.templatePath, 'utf8')
      .replaceAll('__ACCESS_TOKEN__', token)
      .replaceAll('__DEMO_EMAIL__', this.demo.email);
    mkdirSync(dirname(this.generatedPath), { recursive: true });
    writeFileSync(this.generatedPath, environment, { mode: 0o644 });
  }

  async run() {
    const reused = (await this.createdDemoUser()) ? null : this.reusableToken();
    this.writeEnvironment(reused ?? (await this.issueToken()));
    const verb = reused === null ? 'Issued' : 'Reused';
    return `${verb} the demo session token for ${this.demo.email} (${this.generatedPath})`;
  }
}
