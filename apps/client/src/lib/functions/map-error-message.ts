const errorMessages: Record<string, string | undefined> = {
  "Nickname is taken": "Ой, в комнате уже есть игрок с таким никнеймом",
  "Session not found": "Комната не найдена",
  "The game has already started": "Упс, игра уже началась",
  "Need more players": "Нельзя начать игру, пока не наберется хотя бы 3 игрока",
  "Too many players": "Комната заполнена",
  "Session and client version mismatch":
    "Сессия создана на устаревшей версии клиента"
}

function mapErrorMessage(message: string) {
  return errorMessages[message] ?? "Произошла какая-то ошибка"
}

export default mapErrorMessage
