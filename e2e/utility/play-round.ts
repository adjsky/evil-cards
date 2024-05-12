import { expect, type Page } from "@playwright/test"

type PlayRoundProps = {
  players: Page[]
  masterIdx: number
  winnerIdx: number
  beforeRoundEnd?: () => unknown
}

export async function playRound({
  players,
  masterIdx,
  winnerIdx,
  beforeRoundEnd
}: PlayRoundProps) {
  let winnerText: string | null = null

  for (let i = 0; i < players.length; i++) {
    if (i == masterIdx) {
      continue
    }

    const cardToVote = players[i].getByTestId("hand-card").first()

    if (i == winnerIdx) {
      winnerText = await cardToVote.textContent()
    }

    await cardToVote.click()
  }

  await expect(players[masterIdx].getByTestId("voted-card")).toHaveCount(
    players.length - 1
  )

  for (const card of await players[masterIdx].getByTestId("voted-card").all()) {
    await card.click()
  }

  for (const votedCard of await players[masterIdx]
    .getByTestId("voted-card")
    .all()) {
    const votedCardText = await votedCard.textContent()

    if (votedCardText != winnerText) {
      continue
    }

    await votedCard.click()

    await expect(votedCard).toBeDisabled()
  }

  await beforeRoundEnd?.()

  await expect(players[masterIdx].getByTestId("voted-card")).toHaveCount(0)
}
