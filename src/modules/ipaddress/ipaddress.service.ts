import {
  InternalServerErrorException,
  NotFoundException,
} from "@force-dev/utils";
import { injectable } from "inversify";
import { Includeable, Op, WhereOptions } from "sequelize";
import { v4 } from "uuid";

import { config } from "../../../config";
import { IPAddress, TIPAddressModel } from "./ipaddress.model";

const { WG_DEFAULT_ADDRESS } = config;

@injectable()
export class IPAddressService {
  getIPAddresses = (offset?: number, limit?: number) =>
    IPAddress.findAll({
      limit,
      offset,
      attributes: IPAddressService.IPAddressAttributes,
      order: [["createdAt", "DESC"]],
      include: IPAddressService.include,
    });

  getIPAddressByAttr = (where: WhereOptions) =>
    IPAddress.findOne({
      where,
      include: IPAddressService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(new NotFoundException());
      }

      return result;
    });

  getIPAddress = (id: string) =>
    IPAddress.findByPk(id, {
      attributes: IPAddressService.IPAddressAttributes,
      include: IPAddressService.include,
    }).then(result => {
      if (result === null) {
        return Promise.reject(new NotFoundException());
      }

      return result;
    });

  createClientIPAddress = async (clientId: string, serverIp: string) => {
    const res = await this._getFreeIPAddressForClient(serverIp);

    return IPAddress.create({
      id: res.id,
      ...this._splitAddress(res.ip),
      clientId,
    }).then(result => this.getIPAddress(result.id));
  };

  createServerIPAddress = async (serverId: string) => {
    const res = await this._getFreeIPAddressForServer();

    return IPAddress.create({
      id: res.id,
      ...this._splitAddress(res.ip),
      serverId,
    }).then(result => this.getIPAddress(result.id));
  };

  updateFreeStatusIPAddress = (id: string, free: boolean) =>
    IPAddress.update({ free }, { where: { id } }).then(() =>
      this.getIPAddress(id),
    );

  deleteIPAddress = async (id: number) => {
    return IPAddress.destroy({ where: { id } });
  };

  deleteIPAddressForClient = async (clientId: string) => {
    return IPAddress.destroy({ where: { clientId } });
  };

  deleteIPAddressForServer = async (serverId: string) => {
    return IPAddress.destroy({ where: { serverId } });
  };

  formatIp = (...args: (string | number)[]) => {
    return `${args[0]}.${args[1]}.${args[2]}.${args[3]}`;
  };

  private _splitAddress = (address: string) => {
    const [a, b, c, d] = address.split(".");

    return {
      a: Number(a),
      b: Number(b),
      c: Number(c),
      d: Number(d),
    };
  };

  private _getFreeIPAddressForClient = async (serverIpAddress: string) => {
    const defaultIp = this._splitAddress(WG_DEFAULT_ADDRESS);
    const serverIp = this._splitAddress(serverIpAddress);

    const serverWhere = {
      a: {
        [Op.eq]: serverIp.a,
      },
      b: {
        [Op.eq]: serverIp.b,
      },
      c: {
        [Op.eq]: serverIp.c,
      },
    };

    const freeRow = await IPAddress.findOne({
      where: {
        free: true,
        ...serverWhere,
      },
    });

    if (freeRow) {
      return {
        id: freeRow.id,
        ip: this.formatIp(defaultIp.a, freeRow.b, freeRow.c, freeRow.d),
      };
    }

    const max = await IPAddress.max<number | null, IPAddress>("d", {
      where: serverWhere,
    });

    if (max === null || isNaN(Number(max))) {
      return {
        id: v4(),
        ip: this.formatIp(
          serverIp.a,
          serverIp.b,
          serverIp.c,
          Number(serverIp.d) + 1,
        ),
      };
    } else if (Number(max) < 255) {
      return {
        id: v4(),
        ip: this.formatIp(serverIp.a, serverIp.b, serverIp.c, Number(max) + 1),
      };
    }

    throw new InternalServerErrorException(
      "Максимальное число клиентов не больше 254",
    );
  };

  private _getFreeIPAddressForServer = async () => {
    const defaultIp = this._splitAddress(WG_DEFAULT_ADDRESS);

    const freeRow = await IPAddress.findOne({
      where: {
        free: true,
        d: {
          [Op.eq]: "1",
        },
      },
    });

    if (freeRow) {
      return {
        id: freeRow.id,
        ip: this.formatIp(freeRow.a, freeRow.b, freeRow.c, freeRow.d),
      };
    }

    const maxB = await IPAddress.max<number | null, IPAddress>("b");

    if (maxB !== null) {
      const maxC = await IPAddress.max<number | null, IPAddress>("c", {
        where: {
          b: { [Op.eq]: maxB },
        },
      });

      if (maxC !== null && Number(maxC) < 255) {
        return {
          id: v4(),
          ip: this.formatIp(defaultIp.a, maxB, Number(maxC) + 1, 1),
        };
      } else if (Number(maxB) < 255) {
        return {
          id: v4(),
          ip: this.formatIp(defaultIp.a, maxB + 1, 0, 1),
        };
      }

      throw new InternalServerErrorException(
        "Максимальное число клиентов не больше 254",
      );
    }

    return {
      id: v4(),
      ip: this.formatIp(defaultIp.a, 0, 0, 1),
    };
  };

  static get IPAddressAttributes(): (keyof TIPAddressModel)[] {
    return [
      "id",
      "a",
      "b",
      "c",
      "d",
      "clientId",
      "serverId",
      "free",
      "createdAt",
      "updatedAt",
    ];
  }

  static get include(): Includeable[] {
    return [];
  }
}
