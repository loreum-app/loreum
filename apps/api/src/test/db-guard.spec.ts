import { describe, it, expect } from "vitest";
import {
  assertTestDatabase,
  databaseNameFromUrl,
  isTestDatabaseUrl,
} from "./db-guard";

const DEV_URL = "postgresql://lorekeeper:pw@localhost:15432/lorekeeper";
const TEST_URL = "postgresql://lorekeeper:pw@localhost:15432/lorekeeper_test";

describe("test database guard", () => {
  describe("databaseNameFromUrl", () => {
    it("reads the database name from a connection URL", () => {
      expect(databaseNameFromUrl(DEV_URL)).toBe("lorekeeper");
    });

    it("ignores query parameters after the database name", () => {
      expect(
        databaseNameFromUrl(`${TEST_URL}?schema=public&connect_timeout=5`),
      ).toBe("lorekeeper_test");
    });
  });

  describe("isTestDatabaseUrl", () => {
    it("accepts a database whose name ends in _test", () => {
      expect(isTestDatabaseUrl(TEST_URL)).toBe(true);
    });

    it("rejects the development database", () => {
      expect(isTestDatabaseUrl(DEV_URL)).toBe(false);
    });

    it("rejects a name that merely contains test elsewhere", () => {
      expect(
        isTestDatabaseUrl("postgresql://u:p@localhost:5432/test_fixtures"),
      ).toBe(false);
    });

    it("rejects an unset URL", () => {
      expect(isTestDatabaseUrl(undefined)).toBe(false);
    });
  });

  describe("assertTestDatabase", () => {
    it("passes for a test database", () => {
      expect(() => assertTestDatabase(TEST_URL)).not.toThrow();
    });

    it("refuses the development database, naming it in the error", () => {
      expect(() => assertTestDatabase(DEV_URL)).toThrow(/"lorekeeper"/);
    });

    it("explains how to fix an unset DATABASE_URL", () => {
      expect(() => assertTestDatabase("")).toThrow(/DATABASE_URL unset/);
    });
  });
});
