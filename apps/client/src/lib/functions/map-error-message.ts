const errorMessages: Record<string, string | undefined> = {
  "nickname is taken": "Ой, в комнате уже есть игрок с таким никнеймом",
  "session not found": "Комната не найдена",
  "the game has already started": "Упс, игра уже началась",
  "need more players": "Нельзя начать игру, пока не наберется хотя бы 3 игрока",
  "too many players": "Комната заполнена",
  "session and client version mismatch":
    "Сессия создана на устаревшей версии клиента"
}

function mapErrorMessage(message: string) {
  return errorMessages[message] ?? "Произошла какая-то ошибка"
}

export default mapErrorMessage
