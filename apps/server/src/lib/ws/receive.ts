import semverValid from "semver/functions/valid.js"
import z from "zod"

import { implement } from "../zod-implements.ts"

import type { Configuration } from "../../game/types.ts"

const semverString = () =>
  z.string().refine((version) => semverValid(version) != null, {
    message: "invalid semver"
  })

export const createSessionSchema = z.object({
  nickname: z.string(),
  avatarId: z.number(),
  appVersion: semverString()
})
export type CreateSession = z.TypeOf<typeof createSessionSchema>

export const joinSessionSchema = z.object({
  nickname: z.string(),
  sessionId: z.string(),
  avatarId: z.number(),
  appVersion: semverString()
})
export type JoinSession = z.TypeOf<typeof joinSessionSchema>

export const voteSchema = z.object({
  cardId: z.string()
})
export type Vote = z.TypeOf<typeof voteSchema>

export const chooseSchema = z.object({
  playerId: z.string()
})
export type Choose = z.TypeOf<typeof chooseSchema>

export const kickSchema = z.object({
  playerId: z.string()
})
export type Kick = z.TypeOf<typeof chooseSchema>

export const chatSchema = z.object({
  message: z.string()
})

export const configurationSchema = implement<Configuration>().with({
  votingDurationSeconds: z.literal(30).or(z.literal(60)).or(z.literal(90)),
  reader: z.boolean(),
  maxScore: z.literal(10).or(z.literal(15)).or(z.literal(20)),
  version18Plus: z.boolean(),
  public: z.boolean()
})

export const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("createsession"),
    details: createSessionSchema
  }),
  z.object({
    type: z.literal("joinsession"),
    details: joinSessionSchema
  }),
  z.object({
    type: z.literal("startgame")
  }),
  z.object({
    type: z.literal("vote"),
    details: voteSchema
  }),
  z.object({
    type: z.literal("choose"),
    details: chooseSchema
  }),
  z.object({
    type: z.literal("choosewinner"),
    details: chooseSchema
  }),
  z.object({
    type: z.literal("pong")
  }),
  z.object({
    type: z.literal("discardcards")
  }),
  z.object({
    type: z.literal("updateconfiguration"),
    details: configurationSchema
  }),
  z.object({
    type: z.literal("kickplayer"),
    details: kickSchema
  }),
  z.object({
    type: z.literal("chat"),
    details: chatSchema
  })
])
export type Message = z.TypeOf<typeof messageSchema>
