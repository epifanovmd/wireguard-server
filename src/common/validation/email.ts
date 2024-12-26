import { BadRequestException } from "@force-dev/utils";

export const isEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

export const validateEmail = (email: string) => {
  if (!isEmail(email)) {
    throw new BadRequestException(
      "Пожалуйста, введите корректный адрес электронной почты.",
    );
  }
};
