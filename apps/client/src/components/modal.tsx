import React from "react"
import { Dialog, Transition } from "@headlessui/react"

const RootModal: React.FC<
  React.PropsWithChildren<{
    className?: string
    isOpen?: boolean
    onClose?: () => void
  }>
> = ({ children, onClose, isOpen, className }) => {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          onClose && onClose()
        }}
      >
        <Transition.Child
          as={React.Fragment}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 h-full overflow-y-auto">
          <div className="flex h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className={className}>{children}</Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

const Modal = Object.assign(RootModal, {
  Title: Dialog.Title,
  Description: Dialog.Description
})

export default Modal
