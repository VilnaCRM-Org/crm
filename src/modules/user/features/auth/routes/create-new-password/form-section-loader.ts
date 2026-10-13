class CreateNewPasswordFormSectionLoader {
  public load(): Promise<typeof import('./create-new-password-form-section')> {
    return import(
      /* webpackChunkName: "create-new-password-form-section" */
      /* webpackPreload: true */
      './create-new-password-form-section'
    );
  }
}

export default new CreateNewPasswordFormSectionLoader();
