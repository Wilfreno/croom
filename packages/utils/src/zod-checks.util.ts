import * as z from 'zod';

const emailSchema = z.email();
const containsMoreThanEightCharactersSchema = z.string().min(8);
const containsMoreThanTwelveCharactersSchema = z.string().min(12);
const containsUpperCaseSchema = z.string().regex(/[A-Z]/);
const containsLowerCaseSchema = z.string().regex(/[a-z]/);
const containsNumberSchema = z.string().regex(/[0-9]/);
const containsSymbolSchema = z.string().regex(/[^A-Za-z0-9]/);
export function isEmail(email: string) {
  return emailSchema.safeParse(email).success;
}
export function hasMoreThanEightCharacters(data: string) {
  return containsMoreThanEightCharactersSchema.safeParse(data).success;
}

export function hasMoreThanTwelveCharacters(data: string) {
  return containsMoreThanTwelveCharactersSchema.safeParse(data).success;
}

export function hasUpperCase(data: string) {
  return containsUpperCaseSchema.safeParse(data).success;
}

export function hasLowerCase(data: string) {
  return containsLowerCaseSchema.safeParse(data).success;
}

export function hasNumber(data: string) {
  return containsNumberSchema.safeParse(data).success;
}
export function hasSymbol(data: string) {
  return containsSymbolSchema.safeParse(data).success;
}
