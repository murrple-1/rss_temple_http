import {
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  Validators,
  FormGroup,
} from '@angular/forms';

export const MinLength = 6;

export const SpecialCharacters = ['!', '@', '#', '$', '%', '^', '&'];

export function isValidPassword(): ValidatorFn | null {
  return Validators.compose([
    Validators.minLength(MinLength),
    (control: AbstractControl) => {
      let validationErrors: ValidationErrors | null = null;

      const value = control.value as string;

      if (!/[a-z]/.test(value)) {
        /* istanbul ignore next */
        validationErrors = validationErrors ?? {};
        validationErrors.nolowercase = true;
      }

      if (!/[A-Z]/.test(value)) {
        /* istanbul ignore next */
        validationErrors = validationErrors ?? {};
        validationErrors.nouppercase = true;
      }

      if (!/[0-9]/.test(value)) {
        /* istanbul ignore next */
        validationErrors = validationErrors ?? {};
        validationErrors.nodigit = true;
      }

      if (!/[!@#\$%\^&]/.test(value)) {
        /* istanbul ignore next */
        validationErrors = validationErrors ?? {};
        validationErrors.nospecialcharacter = true;
      }

      return validationErrors;
    },
  ]);
}

export function doPasswordsMatch(password1Name: string, password2Name: string) {
  return (group: FormGroup) => {
    let validationErrors: ValidationErrors | null = null;

    const password1 = group.controls[password1Name].value as string;
    const password2 = group.controls[password2Name].value as string;

    if (password1 !== password2) {
      /* istanbul ignore next */
      validationErrors = validationErrors ?? {};
      validationErrors.passwordsdonotmatch = true;
    }

    return validationErrors;
  };
}

export function passwordRequirementsText(_lang: string) {
  // eslint-disable-next-line max-len
  return `Your password must be 6 or more characters long, contain 1 uppercase and 1 lowercase letters, 1 number, and 1 special character (${SpecialCharacters.join(
    '',
  )})`;
}
