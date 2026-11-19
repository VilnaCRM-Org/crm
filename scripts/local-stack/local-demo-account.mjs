export default class LocalDemoAccount {
  constructor(env = process.env) {
    this.env = env;
  }

  credentials() {
    return {
      email: this.env.LOCAL_DEMO_EMAIL ?? 'local-demo@vilnacrm.com',
      password: this.env.LOCAL_DEMO_PASSWORD ?? 'Local1234',
      name: 'Demo User',
    };
  }
}
