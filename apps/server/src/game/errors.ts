export class GameError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class ForbiddenNicknameError extends GameError {
  constructor() {
    super("Nickname is taken")
  }
}

export class GameStartedError extends GameError {
  constructor() {
    super("The game has already started")
  }
}

export class NoPlayerError extends GameError {
  constructor() {
    super("No player associated with socket")
  }
}

export class InvalidPlayerIdError extends GameError {
  constructor() {
    super("Invalid player id")
  }
}

export class InvalidChoosedPlayerIdError extends GameError {
  constructor() {
    super("Invalid choosed player id")
  }
}

export class InvalidCardError extends GameError {
  constructor() {
    super("Invalid card")
  }
}

export class ForbiddenToVoteError extends GameError {
  constructor() {
    super("You can't vote")
  }
}

export class ForbiddenToChooseError extends GameError {
  constructor() {
    super("You can't choose")
  }
}

export class ForbiddenToChooseWinnerError extends GameError {
  constructor() {
    super("You can't choose winner")
  }
}

export class MasterError extends GameError {
  constructor() {
    super("You are not a master")
  }
}

export class HostError extends GameError {
  constructor() {
    super("You are not a host")
  }
}

export class InSessionError extends GameError {
  constructor() {
    super("You are in another session")
  }
}

export class NoSessionError extends GameError {
  constructor() {
    super("You are not in session")
  }
}

export class SessionNotFoundError extends GameError {
  constructor() {
    super("Session not found")
  }
}

export class NotEnoughPlayersError extends GameError {
  constructor() {
    super("Need more players")
  }
}

export class TooManyPlayersError extends GameError {
  constructor() {
    super("Too many players")
  }
}

export class DisconnectedError extends GameError {
  constructor() {
    super("Already disconnected")
  }
}

export class InternalError extends GameError {
  constructor() {
    super("Internal error")
  }
}

export class VersionMismatchError extends GameError {
  constructor() {
    super("Session and client version mismatch")
  }
}

export class DiscardCardsError extends GameError {
  constructor() {
    super("Your score is too low to discard your cards")
  }
}

export class NotPlayingError extends GameError {
  constructor() {
    super("You are not playing")
  }
}

export class SessionCacheSynchronizeError extends GameError {
  constructor() {
    super("Failed to syncronize session cache")
  }
}

export class InvalidSessionStateError extends Error {
  constructor() {
    super("Received session in an invalid state")
  }
}
