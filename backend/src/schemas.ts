import z from "zod"

export const createRoomSchema = z.object({ username: z.string() })
export type CreateRoomDetails = z.TypeOf<typeof createRoomSchema>
export const connectSchema = z.object({ username: z.string() })
export type ConnectDetails = z.TypeOf<typeof connectSchema>

export const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create-room"),
    details: createRoomSchema
  }),
  z.object({
    type: z.literal("connect"),
    details: connectSchema
  })
])
