export const MIN_PLAYERS_TO_START_GAME = 3
export const MAX_PLAYERS_IN_SESSSION = 10

export const USER_ID_SIZE = 5
export const SESSION_ID_SIZE = 5

export const GAME_START_DELAY_MS = 3 * 1000 // 3s
export const BEST_CARD_VIEW_DURATION_MS = 2 * 1000 // 2s
export const ALIVE_CHECK_INTERVAL_MS = 60 * 1000 // 60s
export const ACTIVITY_CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30m
export const SESSION_END_TIMEOUT_MS = 30 * 1000 // 30s
export const LEAVE_TIMEOUT_MS = 15 * 1000 // 15s

export const CUSTOM_WS_CLOSE_CODE = 4321
export const CUSTOM_WS_CLOSE_REASON = {
  KICK: "kick",
  INACTIVE: "inactive"
}
