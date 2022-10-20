const errorMessages: Record<string, string | undefined> = {
  "nickname is taken": "Ой, в комнате уже есть игрок с таким никнеймом",
  "session not found": "Комната не найдена",
  "game is started already": "Упс, игра уже началась",
  "need more players": "Нельзя начать игру пока не наберется хотя бы 2 игрока"
}

function mapErrorMessage(message: string) {
  return errorMessages[message] ?? "Произошла какая-то ошибка"
}

export default mapErrorMessage
