export class ForbiddenNicknameError extends Error {
  constructor() {
    super("nickname is taken")
  }
}

export class GameStartedError extends Error {
  constructor() {
    super("the game has already started")
  }
}

export class NoPlayerError extends Error {
  constructor() {
    super("no player")
  }
}

export class InvalidPlayerIdError extends Error {
  constructor() {
    super("invalid player id")
  }
}

export class InvalidChoosedPlayerIdError extends Error {
  constructor() {
    super("invalid choosed player id")
  }
}

export class InvalidCardError extends Error {
  constructor() {
    super("invalid card")
  }
}

export class ForbiddenToVoteError extends Error {
  constructor() {
    super("you can't vote")
  }
}

export class ForbiddenToChooseError extends Error {
  constructor() {
    super("you can't choose")
  }
}

export class ForbiddenToChooseWinnerError extends Error {
  constructor() {
    super("you can't choose winner")
  }
}

export class MasterError extends Error {
  constructor() {
    super("you are not a master")
  }
}

export class HostError extends Error {
  constructor() {
    super("you are not a host")
  }
}

export class InSessionError extends Error {
  constructor() {
    super("you are in another session")
  }
}

export class NoSessionError extends Error {
  constructor() {
    super("you are not in session")
  }
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("session not found")
  }
}

export class NotEnoughPlayersError extends Error {
  constructor() {
    super("need more players")
  }
}

export class TooManyPlayersError extends Error {
  constructor() {
    super("too many players")
  }
}

export class DisconnectedError extends Error {
  constructor() {
    super("already disconnected")
  }
}

export class MultipleLeaveError extends Error {
  constructor() {
    super("you can't leave more than once")
  }
}

export class InternalError extends Error {
  constructor() {
    super("internal error")
  }
}
