export interface RegistrationsValidator {
  validateNotAlreadyRegistered(
    eventId: string,
    userId: string,
  ): Promise<boolean>;
  validateRegistrationOwner(
    registrationId: string,
    userId: string,
  ): Promise<boolean>;
  validateCanCancel(registrationId: string): Promise<boolean>;
}
