class TwoFactorFormSectionLoader {
  public load(): Promise<typeof import('./two-factor-form-section')> {
    return import(
      /* webpackChunkName: "two-factor-form-section" */
      /* webpackPreload: true */
      './two-factor-form-section'
    );
  }
}

export default new TwoFactorFormSectionLoader();
