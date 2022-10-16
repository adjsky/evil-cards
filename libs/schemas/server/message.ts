import z from "zod";

export const createSessionSchema = z.object({ username: z.string() });
export type CreateSessionSchema = z.TypeOf<typeof createSessionSchema>;
export const joinSessionSchema = z.object({
  username: z.string(),
  sessionId: z.string(),
});
export type JoinSessionSchema = z.TypeOf<typeof joinSessionSchema>;
export const voteSchema = z.object({
  text: z.string(),
});
export type VoteSchema = z.TypeOf<typeof voteSchema>;
export const chooseSchema = z.object({
  id: z.string(),
});
export type ChooseSchema = z.TypeOf<typeof chooseSchema>;

export const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("createsession"),
    details: createSessionSchema,
  }),
  z.object({
    type: z.literal("joinsession"),
    details: joinSessionSchema,
  }),
  z.object({
    type: z.literal("startgame"),
  }),
  z.object({
    type: z.literal("vote"),
    details: voteSchema,
  }),
  z.object({
    type: z.literal("choose"),
    details: chooseSchema,
  }),
  z.object({
    type: z.literal("choosebest"),
    details: chooseSchema,
  }),
]);
export type MessageSchema = z.TypeOf<typeof messageSchema>;
