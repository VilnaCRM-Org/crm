class SignUpFormSectionLoader {
  public load(): Promise<typeof import('./sign-up-form-section')> {
    return import(
      /* webpackChunkName: "sign-up-form-section" */
      /* webpackPreload: true */
      './sign-up-form-section'
    );
  }
}

export default new SignUpFormSectionLoader();
