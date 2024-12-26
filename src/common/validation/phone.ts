import { BadRequestException } from "@force-dev/utils";

export const isPhone = (phone: string) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;

  return phoneRegex.test(phone);
};

export const validatePhone = (phone: string) => {
  if (phone && !isPhone(phone)) {
    throw new BadRequestException(
      "Пожалуйста, введите корректный номер телефона.",
    );
  }
};
