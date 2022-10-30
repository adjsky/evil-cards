import tap from "tap"
import Session from "./session"
import sinon from "sinon"

tap.test("working", (t) => {
  t.plan(1)

  const session = new Session()
  t.equal(session.redCard, null)
})
