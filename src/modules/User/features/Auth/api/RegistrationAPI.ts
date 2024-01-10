
interface ICredentials {
  nameAndSurname: string,
  email: string,
  password: string,
}

export default class RegistrationAPI {
  public register(credentials: ICredentials) {
    console.log('in RegistrationAPI.ts line 11', credentials);
  }
}
