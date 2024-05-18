import fs from "node:fs"
import path from "node:path"

import { findWorkspaceDir } from "@pnpm/find-workspace-dir"
import { parse as parseCsvSync } from "csv-parse/sync"

import { log } from "./fastify"

export type AvailableDeckNames = "twitchfriendly" | "normal"
export type CustomDeckName = "custom"

export const availableDecks = ["normal", "twitchfriendly"] as const

export function isDeckNameDefined(name: string): name is AvailableDeckNames {
  return availableDecks.includes(name as AvailableDeckNames)
}

export type UploadedDeck = {
  red: string[]
  white: string[]
}

export type PreCollectedDecks = Record<AvailableDeckNames, UploadedDeck>

const DECKS_FOLDER = "decks"
const COLOR_COLUMN_NAME = "color"
const TEXT_COLUMN_NAME = "text"
const EXTENSION = ".tsv"

const MIN_RED_DECK_SIZE = 100
const MIN_WHITE_DECK_SIZE = 400
const MAX_CARD_TEXT_SIZE = 120

export async function preCollectDecks() {
  const workspaceDir = await findWorkspaceDir(process.cwd())

  if (!workspaceDir) {
    throw new Error(
      "Something is really wrong... Could not find workspace root dir, do you still use PNPM?"
    )
  }

  const deckFileNames = fs.readdirSync(`${workspaceDir}/${DECKS_FOLDER}`)

  const preCollectedDecks = {} as PreCollectedDecks

  for (const fileName of deckFileNames) {
    const { name, ext } = path.parse(fileName)

    if (ext != EXTENSION) {
      continue
    }

    if (!isDeckNameDefined(name)) {
      log.warn(`Trying to parse unknown deck (${name})}`)

      continue
    }

    const file = fs.readFileSync(`${workspaceDir}/decks/${fileName}`)

    preCollectedDecks[name] = parseData(
      parseCsvSync(file, {
        delimiter: "\t",
        columns: true,
        trim: true
      })
    )
  }

  return preCollectedDecks
}

export function parseBase64Deck(base64: string) {
  return parseData(
    parseCsvSync(Buffer.from(base64.split(",")[1], "base64"), {
      delimiter: "\t",
      columns: true,
      trim: true
    })
  )
}

function parseData(data: Record<string, string>[]) {
  const cards = { white: [] as string[], red: [] as string[] }

  for (const row of data) {
    if (!(COLOR_COLUMN_NAME in row)) {
      throw new Error(`No \`${COLOR_COLUMN_NAME}\` column found`)
    }

    if (!(TEXT_COLUMN_NAME in row)) {
      throw new Error(`No \`${TEXT_COLUMN_NAME}\` column found`)
    }

    const color = row[COLOR_COLUMN_NAME].trim()
    const text = row[TEXT_COLUMN_NAME].trim()

    if (color != "white" && color != "red") {
      throw new Error(
        `Card color must be either \`white\` or \`red\`, received \`${color}\``
      )
    }

    if (text.length == 0) {
      throw new Error(`Card text can't be empty`)
    }

    if (text.length > MAX_CARD_TEXT_SIZE) {
      throw new Error(
        `Card text can't be larger than ${MAX_CARD_TEXT_SIZE} characters`
      )
    }

    cards[color].push(text)
  }

  if (cards.white.length < MIN_WHITE_DECK_SIZE) {
    throw new Error(
      `Size of the white deck must be at least ${MIN_WHITE_DECK_SIZE} cards`
    )
  }

  if (cards.red.length < MIN_RED_DECK_SIZE) {
    throw new Error(
      `Size of the red deck must be at least ${MIN_RED_DECK_SIZE} cards`
    )
  }

  return cards
}
