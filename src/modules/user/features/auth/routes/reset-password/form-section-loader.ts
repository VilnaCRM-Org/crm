class ResetPasswordFormSectionLoader {
  public load(): Promise<typeof import('./reset-password-form-section')> {
    return import(
      /* webpackChunkName: "reset-password-form-section" */
      /* webpackPreload: true */
      './reset-password-form-section'
    );
  }
}

export default new ResetPasswordFormSectionLoader();
