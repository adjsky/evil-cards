const formatErrors = (
  /** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
  errors
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value) {
        return `${name}: ${value._errors.join(", ")}\n`
      } else {
        return `${value.join(", ")}\n`
      }
    })
    .filter(Boolean)

export default formatErrors
