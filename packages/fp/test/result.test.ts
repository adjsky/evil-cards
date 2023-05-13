import { Result } from "../lib"

describe("asyncTryCatch", () => {
  it("returns ok for non-throwing functions", async () => {
    const result = await Result.asyncTryCatch(() => {
      return Promise.resolve(4)
    })

    expect(result.ok).toBeTruthy()
    expect(result.unwrap()).toBe(4)
  })

  it("returns err for throwing functions", async () => {
    const result = await Result.asyncTryCatch(() => {
      return Promise.reject(5)
    })

    expect(result.ok).toBeFalsy()
    expect(result.unwrapErr()).toBe(5)
  })
})
