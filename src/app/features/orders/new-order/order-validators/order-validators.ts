import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

const EGYPTIAN_MOBILE = /^01[0125]\d{8}$/;

export const requireAtLeastOne: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const items = control as FormArray;
  return items.length > 0 ? null : { noItems: true };
};

export const egyptianMobile: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null;
  if (!value) return null;
  return EGYPTIAN_MOBILE.test(value) ? null : { egyptianMobile: true };
};

export const orderTypeRules: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const type = group.get('type')?.value as string | null;
  const table = group.get('table')?.value as number | null;
  const phone = group.get('phone')?.value as string | null;

  const errors: ValidationErrors = {};

  if (type === 'dine-in') {
    if (table === null || table === undefined || (table as unknown) === '') {
      errors['tableRequired'] = true;
    } else if (table < 1 || table > 40 || !Number.isInteger(table)) {
      errors['tableRange'] = true;
    }
  }

  if (type === 'delivery' && !phone) {
    errors['phoneRequired'] = true;
  }

  return Object.keys(errors).length ? errors : null;
};