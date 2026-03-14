import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Decorador personalizado para validar números telefónicos de México
 * Acepta formatos:
 * - 10 dígitos: 5512345678
 * - Con código de país: +525512345678 o 525512345678
 */
export function IsMexicanPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMexicanPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'El número telefónico debe tener un formato válido de México (10 dígitos, opcionalmente precedido por +52 o 52)',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Patrón para números telefónicos mexicanos
          const mexicanPhonePattern = /^(\+52|52)?[1-9][0-9]{9}$/;
          return mexicanPhonePattern.test(value);
        },
      },
    });
  };
}
