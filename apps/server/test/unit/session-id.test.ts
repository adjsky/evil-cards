import { nanoid } from "nanoid"
import { expect, test, vi } from "vitest"

import Session from "../../src/game/session.ts"

const plannedId = "fakeId"

vi.mock("nanoid", () => {
  return {
    nanoid: vi.fn(() => plannedId)
  }
})

test("session creates with random id provided by nanoid", async () => {
  const newSession = new Session()

  expect(newSession.id).toBe(plannedId)
  expect(nanoid).toBeCalledTimes(1)
})
