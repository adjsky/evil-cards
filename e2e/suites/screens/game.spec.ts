import { expect, test } from "fixtures/game"
import { playRound } from "utility/play-round"

test("Список игроков", async ({ players }) => {
  await Promise.all(
    players.map((player) =>
      expect(player.getByTestId("player-list-desktop")).toHaveScreenshot()
    )
  )

  await playRound({
    players,
    masterIdx: 0,
    winnerIdx: 1,
    beforeRoundEnd: () =>
      Promise.all(
        players.map((player) =>
          expect(player.getByTestId("player-list-desktop")).toHaveScreenshot()
        )
      )
  })

  await Promise.all(
    players.map((player) =>
      expect(player.getByTestId("player-list-desktop")).toHaveScreenshot()
    )
  )
})

test("Сброс карт", async ({ players }) => {
  await Promise.all(
    players.map((player) => player.getByTestId("discard-hand").click())
  )

  await Promise.all(
    players.map((player) =>
      expect(player.getByTestId("confirm-discard-hand")).toBeDisabled()
    )
  )

  await Promise.all(
    players.map((player) => player.getByTestId("abort-discard-hand").click())
  )

  await playRound({
    players,
    masterIdx: 0,
    winnerIdx: 1
  })

  await Promise.all(
    players.map((player) => player.getByTestId("discard-hand").click())
  )

  await Promise.all(
    players.map((player, idx) => {
      const confirmButton = player.getByTestId("confirm-discard-hand")

      if (idx == 1) {
        return expect(confirmButton).toBeEnabled()
      }

      return expect(confirmButton).toBeDisabled()
    })
  )
})
