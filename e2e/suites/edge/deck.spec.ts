import { expect, test } from "fixtures/game"
import { playRound } from "utility/play-round"

test.use({ nPlayers: 10 })

test("Рука пополняется", { tag: "@slow" }, async ({ players, nPlayers }) => {
  test.setTimeout(0)

  for (let round = 1; round <= 90; round++) {
    const winnerIdx = round % nPlayers
    const masterIdx = (round - 1) % nPlayers

    await playRound({
      players,
      masterIdx,
      winnerIdx
    })

    await Promise.all(
      players.map((player) =>
        expect(player.getByTestId("hand-card")).toHaveCount(10)
      )
    )
  }
})
