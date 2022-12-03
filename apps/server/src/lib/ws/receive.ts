import z from "zod"

export const createSessionSchema = z.object({
  username: z.string(),
  avatarId: z.number()
})
export type CreateSession = z.TypeOf<typeof createSessionSchema>
export const joinSessionSchema = z.object({
  username: z.string(),
  sessionId: z.string(),
  avatarId: z.number()
})
export type JoinSession = z.TypeOf<typeof joinSessionSchema>
export const voteSchema = z.object({
  text: z.string()
})
export type Vote = z.TypeOf<typeof voteSchema>
export const chooseSchema = z.object({
  userId: z.string()
})
export type Choose = z.TypeOf<typeof chooseSchema>
export const configurationSchema = z.object({
  votingDurationSeconds: z.literal(30).or(z.literal(60)).or(z.literal(90)),
  reader: z.enum(["off", "on"]),
  maxScore: z.literal(10).or(z.literal(15)).or(z.literal(20))
})
export type Configuration = z.TypeOf<typeof configurationSchema>

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
    type: z.literal("leavesession")
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
    type: z.literal("choosebest"),
    details: chooseSchema
  }),
  z.object({
    type: z.literal("pong")
  }),
  z.object({
    type: z.literal("updateconfiguration"),
    details: configurationSchema
  })
])
export type Message = z.TypeOf<typeof messageSchema>
