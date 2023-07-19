export class GameError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class ForbiddenNicknameError extends GameError {
  constructor() {
    super("nickname is taken")
  }
}

export class GameStartedError extends GameError {
  constructor() {
    super("the game has already started")
  }
}

export class NoPlayerError extends GameError {
  constructor() {
    super("no player")
  }
}

export class InvalidPlayerIdError extends GameError {
  constructor() {
    super("invalid player id")
  }
}

export class InvalidChoosedPlayerIdError extends GameError {
  constructor() {
    super("invalid choosed player id")
  }
}

export class InvalidCardError extends GameError {
  constructor() {
    super("invalid card")
  }
}

export class ForbiddenToVoteError extends GameError {
  constructor() {
    super("you can't vote")
  }
}

export class ForbiddenToChooseError extends GameError {
  constructor() {
    super("you can't choose")
  }
}

export class ForbiddenToChooseWinnerError extends GameError {
  constructor() {
    super("you can't choose winner")
  }
}

export class MasterError extends GameError {
  constructor() {
    super("you are not a master")
  }
}

export class HostError extends GameError {
  constructor() {
    super("you are not a host")
  }
}

export class InSessionError extends GameError {
  constructor() {
    super("you are in another session")
  }
}

export class NoSessionError extends GameError {
  constructor() {
    super("you are not in session")
  }
}

export class SessionNotFoundError extends GameError {
  constructor() {
    super("session not found")
  }
}

export class NotEnoughPlayersError extends GameError {
  constructor() {
    super("need more players")
  }
}

export class TooManyPlayersError extends GameError {
  constructor() {
    super("too many players")
  }
}

export class DisconnectedError extends GameError {
  constructor() {
    super("already disconnected")
  }
}

export class InternalError extends GameError {
  constructor() {
    super("internal error")
  }
}

export class VersionMismatchError extends GameError {
  constructor() {
    super("session and client version mismatch")
  }
}

export class DiscardCardsError extends GameError {
  constructor() {
    super("your score is too low to discard your cards")
  }
}

export class NotPlayingError extends GameError {
  constructor() {
    super("you are not playing")
  }
}

export class SessionCacheSynchronizeError extends GameError {
  constructor() {
    super("failed to syncronize session cache")
  }
}
