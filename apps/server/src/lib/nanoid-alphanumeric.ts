import { customAlphabet } from "nanoid"

const lowercase = "abcdefghijklmnopqrstuvwxyz"
const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const numbers = "0123456789"

export const nanoid = customAlphabet(lowercase + uppercase + numbers)
