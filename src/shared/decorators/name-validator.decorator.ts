import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidName',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'El nombre solo puede contener letras y espacios',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
          return nameRegex.test(value);
        },
      },
    });
  };
}
