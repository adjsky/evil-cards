import React, { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockAnimationsApi } from "jsdom-testing-mocks"

import Snackbar from "@/components/snackbar"

function SnackbarToggle() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open">
        Open
      </button>
      <Snackbar open={open} onClose={() => setOpen(false)} />
    </>
  )
}

mockAnimationsApi()

it("should open the snackbar on button click", async () => {
  const user = userEvent.setup()

  render(<SnackbarToggle />)

  await user.click(screen.getByLabelText(/open/i))
  expect(screen.getByRole("alert")).toBeInTheDocument()
})
