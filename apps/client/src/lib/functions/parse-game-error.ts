import type { Error } from "@evil-cards/server/src/ws/send"

const errorMessages: Partial<Record<NonNullable<Error["kind"]>, string>> = {
  ForbiddenNickname: "Ой, в комнате уже есть игрок с таким никнеймом",
  SessionNotFound: "Комната не найдена",
  GameAlreadyStarted: "Упс, игра уже началась",
  NotEnoughPlayers: "Нельзя начать игру, пока не наберется хотя бы 3 игрока",
  TooManyPlayers: "Комната заполнена",
  VersionMismatch: "Ваша версия клиента не поддерживается сервером"
}

function parseGameError(kind: NonNullable<Error["kind"]>) {
  return errorMessages[kind] ?? "Произошла какая-то ошибка"
}

export default parseGameError
