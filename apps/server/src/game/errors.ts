export type GameErrorKind =
  | "ForbiddenNickname"
  | "ForbiddenNickname"
  | "GameAlreadyStarted"
  | "NoPlayer"
  | "InvalidPlayerId"
  | "InvalidChoosedPlayerId"
  | "InvalidCard"
  | "ForbbidenToVote"
  | "ForbiddenToChoose"
  | "ForbiddenToChooseWinner"
  | "Master"
  | "Host"
  | "InSession"
  | "NoSession"
  | "SessionNotFound"
  | "NotEnoughPlayers"
  | "TooManyPlayers"
  | "Disconnected"
  | "VersionMismatch"
  | "ScoreIsTooLowToDiscardCards"
  | "NotPlaying"
  | "FailedToSyncronizeCache"
  | "InvalidSessionState"
  | "DeckNotInitialized"
  | "FailedToParseCustomDeck"
  | "InvalidNickname"

export class GameError extends Error {
  kind: GameErrorKind

  constructor(kind: GameErrorKind, message?: string) {
    super(message ?? "Game error")
    this.kind = kind
  }
}
