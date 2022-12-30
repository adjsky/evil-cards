import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockAnimationsApi } from "jsdom-testing-mocks"

import Snackbar from "@/components/snackbar"

mockAnimationsApi()

const animationDuration = 5

it("closes when the close button is clicked", async () => {
  const user = userEvent.setup()

  render(<Snackbar animationDuration={animationDuration} open />)
  expect(screen.getByRole("alert")).toBeInTheDocument()

  await user.click(screen.getByLabelText(/close/i))

  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  )
})

it("calls onClose", async () => {
  const user = userEvent.setup()
  const mockFn = jest.fn()

  render(
    <Snackbar animationDuration={animationDuration} onClose={mockFn} open />
  )

  await user.click(screen.getByLabelText(/close/i))
  await waitFor(() =>
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  )

  expect(mockFn).toBeCalledTimes(1)
})

it("autohides", async () => {
  const autoHideDuration = 10

  render(
    <Snackbar
      animationDuration={animationDuration}
      autoHideDuration={autoHideDuration}
      open
    />
  )

  waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
})
