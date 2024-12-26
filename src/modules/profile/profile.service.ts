import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
} from "@force-dev/utils";
import { inject, injectable } from "inversify";
import { Includeable, Op, WhereOptions } from "sequelize";

import { generateOtp } from "../../common";
import { ApiResponse } from "../../dto/ApiResponse";
import { MailerService } from "../mailer";
import { Otp } from "../otp";
import { EPermissions, Permission } from "../permission";
import { ERole, Role } from "../role";
import {
  IProfilePrivilegesRequest,
  IProfileUpdateRequest,
  Profile,
  ProfileModel,
  TProfileCreateModel,
} from "./profile.model";

@injectable()
export class ProfileService {
  constructor(@inject(MailerService) private _mailerService: MailerService) {}
  getAllProfile = (offset?: number, limit?: number) =>
    Profile.findAll({
      limit,
      offset,
      attributes: ProfileService.profileAttributes,
      order: [["createdAt", "DESC"]],
      include: ProfileService.include,
    });

  getProfileByAttr = (where: WhereOptions<Profile>) =>
    Profile.findOne({
      where,
      include: ProfileService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Профиль пользователя не найден"),
        );
      }

      return result;
    });

  getProfile = (id: string) =>
    Profile.findByPk(id, {
      attributes: ProfileService.profileAttributes,
      include: ProfileService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(
          new NotFoundException("Профиль пользователя не найден"),
        );
      }

      return result;
    });

  createProfile = (body: TProfileCreateModel) => {
    return Profile.create(body).then(result => {
      return this.setPrivileges(result.id, ERole.USER, [
        EPermissions.READ,
        EPermissions.WRITE,
        EPermissions.DELETE,
      ]);
    });
  };

  createAdmin = (body: TProfileCreateModel) => {
    const profile = this.getProfileByAttr({
      [Op.or]: [{ email: body.email }, { phone: body.phone }],
    }).catch(() => Profile.create(body));

    return profile.then(result => {
      return this.setPrivileges(result.id, ERole.ADMIN, [
        EPermissions.READ,
        EPermissions.WRITE,
        EPermissions.DELETE,
      ]);
    });
  };

  updateProfile = (id: string, body: IProfileUpdateRequest) =>
    Profile.update(body, { where: { id } }).then(() => this.getProfile(id));

  setPrivileges = async (
    profileId: string,
    roleName: IProfilePrivilegesRequest["roleName"],
    permissions: IProfilePrivilegesRequest["permissions"],
  ) => {
    const profile = await Profile.findByPk(profileId);

    if (!profile) {
      return Promise.reject(
        new NotFoundException("Профиль пользователя не найден"),
      );
    }

    const [role] = await Role.findOrCreate({
      where: { name: roleName },
    });

    if (role) {
      await profile.setRole(role);

      const permissionInstances = await Promise.all(
        permissions.map(permissionName =>
          Permission.findOrCreate({ where: { name: permissionName } }).then(
            ([permission]) => permission,
          ),
        ),
      );

      await role.setPermissions(permissionInstances);
    }

    return this.getProfile(profileId);
  };

  requestVerifyEmail = async (profileId: string, email?: string) => {
    const profile = await this.getProfile(profileId);

    if (profile.emailVerified) {
      throw new ConflictException("Email уже подтвержден.");
    }

    if (!email) {
      throw new NotFoundException("У пользователя отсутсвует email.");
    }

    const code = generateOtp();
    const findOtp = await Otp.findOne({ where: { profileId } });

    if (findOtp) {
      findOtp.code = code;
      findOtp.expireAt = new Date(Date.now() + 10 * 60 * 1000);

      await findOtp.save();
    } else {
      await Otp.create({
        profileId,
        code,
        expireAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    }

    await this._mailerService.sendCodeMail(email, code);
  };

  verifyEmail = async (profileId: string, code: string) => {
    const profile = await this.getProfile(profileId);

    if (profile.emailVerified) {
      throw new ConflictException("Email уже подтвержден.");
    }
    const otp = await Otp.findOne({ where: { profileId, code } });

    console.log("otp", otp?.code);

    if (!otp) {
      throw new BadRequestException(
        "Неверный код. Пожалуйста, повторите попытку.",
      );
    }

    if (otp.expireAt < new Date()) {
      throw new GoneException(
        "Срок действия кода истек. Пожалуйста, запросите новый код.",
      );
    }

    profile.emailVerified = true;

    await otp.destroy();
    await profile.save();

    return new ApiResponse({
      message: "Email успешно подтвержден.",
      data: {},
    });
  };

  deleteProfile = async (profileId: string) => {
    return Profile.destroy({ where: { id: profileId } }).then(() => profileId);
  };

  static get profileAttributes(): (keyof ProfileModel)[] {
    return [
      "id",
      "phone",
      "email",
      "emailVerified",
      "firstName",
      "lastName",
      "challenge",
      "createdAt",
      "updatedAt",
    ];
  }

  static get include(): Includeable[] {
    return [
      {
        model: Role,
        // attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: Permission,
            // attributes: { exclude: ["createdAt", "updatedAt"] },
            through: {
              attributes: [], // Исключаем атрибуты связывающей таблицы
            },
          },
        ],
      },
    ];
  }
}
