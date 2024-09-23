import "reflect-metadata";

import { UtilsService } from "./utils.service";

describe("UtilsService", () => {
  let utilsService: UtilsService;

  beforeEach(() => {
    utilsService = new UtilsService();
  });

  describe("isValidIPv4", () => {
    it("should return true for valid IPv4 addresses", () => {
      expect(utilsService.isValidIPv4("192.168.0.1")).toBe(true);
      expect(utilsService.isValidIPv4("255.255.255.255")).toBe(true);
      expect(utilsService.isValidIPv4("0.0.0.0")).toBe(true);
    });

    it("should return false for invalid IPv4 addresses", () => {
      expect(utilsService.isValidIPv4("256.256.256.256")).toBe(false);
      expect(utilsService.isValidIPv4("192.168.0")).toBe(false);
      expect(utilsService.isValidIPv4("192.168.0.abc")).toBe(false);
      expect(utilsService.isValidIPv4("")).toBe(false);
    });
  });

  describe("exec", () => {
    let originalPlatform: NodeJS.Platform;

    beforeAll(() => {
      // Сохраните оригинальное значение process.platform
      originalPlatform = process.platform;
    });

    afterAll(() => {
      // Восстановите оригинальное значение process.platform
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
      });
    });

    it("should resolve with stdout for valid command on Linux", async () => {
      // Подмените значение process.platform на 'linux'
      Object.defineProperty(process, "platform", {
        value: "linux",
      });

      const execSpy = jest
        .spyOn(require("child_process"), "exec")
        .mockImplementation((cmd, callback: any) => {
          callback(null, "command output", "");
        });

      await expect(utilsService.exec("echo 'Hello World'")).resolves.toBe(
        "command output",
      );

      execSpy.mockRestore();
    });

    it("should reject with stderr for invalid command on Linux", async () => {
      // Подмените значение process.platform на 'linux'
      Object.defineProperty(process, "platform", {
        value: "linux",
      });

      const execSpy = jest
        .spyOn(require("child_process"), "exec")
        .mockImplementation((cmd, callback: any) => {
          callback(new Error("error"), "", "command error");
        });

      await expect(utilsService.exec("invalid_command")).rejects.toBe(
        "Error: command error",
      );

      execSpy.mockRestore();
    });

    it("should resolve with empty string on non-Linux platforms", async () => {
      // Подмените значение process.platform на 'win32'
      Object.defineProperty(process, "platform", {
        value: "win32",
      });

      await expect(utilsService.exec("any command")).resolves.toBe("");
    });
  });
});
