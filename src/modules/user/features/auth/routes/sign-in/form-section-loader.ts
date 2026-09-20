class SignInFormSectionLoader {
  public load(): Promise<typeof import('./sign-in-form-section')> {
    return import(
      /* webpackChunkName: "sign-in-form-section" */
      /* webpackPreload: true */
      './sign-in-form-section'
    );
  }
}

export default new SignInFormSectionLoader();
