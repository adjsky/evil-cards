import { expect, test, vi } from "vitest"

import { SessionFactory } from "../../src/game/session.ts"

vi.mock("nanoid", () => {
  return {
    customAlphabet: vi.fn(() => () => "fakeId")
  }
})

const sessionFct = new SessionFactory()
await sessionFct.init()

test("session creates with random id provided by nanoid", async () => {
  const session = sessionFct.create()

  expect(session.id).toBe("fakeId")
})
