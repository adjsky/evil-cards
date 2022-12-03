import { jest } from "@jest/globals"

const plannedId = "fakeId"
jest.unstable_mockModule("nanoid", () => ({
  nanoid: jest.fn(() => plannedId)
}))
const Session = (await import("../../src/game/session")).default
const nanoid = (await import("nanoid")).nanoid

test("session creates with random id provided by nanoid", async () => {
  const newSession = new Session()

  expect(newSession.id).toBe(plannedId)
  expect(nanoid).toBeCalledTimes(1)
})
