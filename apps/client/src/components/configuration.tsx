import { autoUpdate, useFloating } from "@floating-ui/react-dom"
import { Listbox, RadioGroup, Transition } from "@headlessui/react"
import React, { useEffect, useId, useState } from "react"
import { createPortal } from "react-dom"
import { Tooltip } from "react-tooltip"

import cn from "@/lib/functions/cn"

import { ReactComponent as ArrowDown } from "@/assets/arrows/down.svg"
import { ReactComponent as TooltipIcon } from "@/assets/tooltip.svg"

import ExternalUnderlineLink from "./external-underline-link"
import Loader from "./loader"
import { notify } from "./snackbar"

import type { Configuration as ConfigurationType } from "@evil-cards/server/src/ws/send"

const visibilityOptions = [
  { value: false, name: "НЕТ" },
  { value: true, name: "ДА" }
] as const

const votingPeriodOptions = [
  { value: 60, name: "Нормальная" },
  { value: 30, name: "Быстрая" },
  { value: 90, name: "Медленная" }
] as const

const maxScoreOptions = [
  { value: 7, name: "7" },
  { value: 10, name: "10" },
  { value: 15, name: "15" },
  { value: 20, name: "20" }
] as const

const readerOptions = [
  { value: false, name: "Нет" },
  { value: true, name: "Есть" }
] as const

const deckOptions = [
  { value: "normal", name: "Обычный" },
  { value: "twitchfriendly", name: "Twitch-friendly" },
  { value: "custom", name: "Кастомный" }
] as const

const MAX_UPLOADED_FILE_SIZE_IN_BYTES = 1 * 1024 * 1024 // 1mb

const Configuration: React.FC<{
  configuration: ConfigurationType
  host?: boolean
  onSave: (configuration: ConfigurationType) => void
  onDeckUpload: (base64: string, onFinish: (ok: boolean) => void) => void
}> = ({ configuration, host, onSave, onDeckUpload }) => {
  const [configurationCopy, setConfigurationCopy] = useState({
    ...configuration
  })
  useEffect(() => {
    setConfigurationCopy(configuration)
  }, [configuration])

  const [isUploadingDeck, setIsUploadingDeck] = useState(false)

  const handleChange = (configuration: Partial<ConfigurationType>) => {
    setConfigurationCopy((prev) => {
      const updated = {
        ...prev,
        ...configuration
      }

      onSave(updated)

      return updated
    })
  }

  const handleDeckChange = (deck: (typeof deckOptions)[number]["value"]) => {
    if (deck == "custom") {
      setIsUploadingDeck(true)

      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".tsv"

      input.addEventListener("change", (event) => {
        const file = (event.currentTarget as HTMLInputElement).files?.[0]

        if (!file) {
          return
        }

        if (file.size > MAX_UPLOADED_FILE_SIZE_IN_BYTES) {
          notify({
            message: "Файл слишком большой",
            infinite: false,
            severity: "error"
          })

          return
        }

        const reader = new FileReader()

        reader.addEventListener("load", () => {
          onDeckUpload(reader.result as string, (ok) => {
            setIsUploadingDeck(false)

            if (ok) {
              handleChange({ deck })
            }
          })
        })

        reader.readAsDataURL(file)
      })

      input.addEventListener("cancel", () => {
        setIsUploadingDeck(false)
      })

      input.click()

      return
    }

    handleChange({ deck })
  }

  return (
    <div className="scrollable flex h-full min-h-0 w-full flex-col gap-4">
      <Row label="Комната публична">
        <Radio
          label="Комната публична"
          options={visibilityOptions}
          value={configurationCopy["public"]}
          disabled={!host}
          onChange={(_public) => handleChange({ public: _public })}
        />
      </Row>
      <Row label="Набор карт" tooltip={<DeckTooltip />}>
        <Select
          options={deckOptions}
          value={configurationCopy["deck"]}
          disabled={!host}
          loading={isUploadingDeck}
          onChange={handleDeckChange}
        />
      </Row>
      <Row label="Скорость игры">
        <Select
          options={votingPeriodOptions}
          value={configurationCopy["votingDurationSeconds"]}
          disabled={!host}
          onChange={(votingDurationSeconds) =>
            handleChange({ votingDurationSeconds })
          }
        />
      </Row>
      <Row label="Озвучка">
        <Radio
          label="Озвучка"
          options={readerOptions}
          value={configurationCopy["reader"]}
          disabled={!host}
          onChange={(reader) => handleChange({ reader })}
        />
      </Row>
      <Row label="Количество очков для победы">
        <Select
          options={maxScoreOptions}
          value={configurationCopy["maxScore"]}
          disabled={!host}
          onChange={(maxScore) => handleChange({ maxScore })}
        />
      </Row>
    </div>
  )
}

function DeckTooltip() {
  return (
    <>
      Информацию об использовании кастомных наборов карт можно найти на{" "}
      <ExternalUnderlineLink
        href="https://github.com/adjsky/evil-cards/blob/master/decks"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
      </ExternalUnderlineLink>
      .
    </>
  )
}

function Row({
  label,
  tooltip,
  children
}: {
  label: string
  tooltip?: React.ReactNode | string
  children: React.ReactNode
}) {
  const id = useId()

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <span className="flex items-center gap-2 text-center font-bold uppercase text-gray-100 sm:text-left">
        <span>{label}</span>
        {tooltip ? (
          <>
            <TooltipIcon data-tooltip-id={id} className="fill-gray-100" />
            <Tooltip
              className="max-w-xs !rounded-lg !px-3 !py-2 !text-sm font-normal normal-case !transition-opacity"
              clickable
              id={id}
              opacity={1}
            >
              {tooltip}
            </Tooltip>
          </>
        ) : null}
      </span>
      {children}
    </div>
  )
}

type Option<T> = {
  value: T
  name: string
}

type SelectProps<T> = {
  options: readonly Option<T>[]
  value: T extends (infer U)[] ? U : T
  disabled?: boolean
  loading?: boolean
  onChange?: (value: T extends (infer U)[] ? U : T) => void
}

function Select<T>({
  options,
  value,
  disabled,
  loading,
  onChange
}: SelectProps<T>) {
  const { x, y, strategy, refs } = useFloating({
    whileElementsMounted: autoUpdate
  })

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled || loading}>
      <Listbox.Button
        className={({ disabled }) =>
          cn(
            "flex w-full flex-shrink-0 items-center justify-between gap-4 rounded-lg bg-gray-100 p-4 sm:w-56",
            disabled && "opacity-50"
          )
        }
        ref={refs.setReference}
      >
        {loading ? (
          <Loader className="mx-auto fill-gray-900" width={16} height={16} />
        ) : (
          ({ open }) => (
            <>
              <span className="text-base font-semibold uppercase leading-none text-gray-900">
                {options.find((option) => option.value == value)?.name}
              </span>
              <ArrowDown className={cn(open && "rotate-180")} />
            </>
          )
        )}
      </Listbox.Button>
      <Portal>
        <Transition
          as={React.Fragment}
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          leave="transition ease-in duration-75"
        >
          <Listbox.Options
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: refs.reference.current?.getBoundingClientRect().width
            }}
            className="z-50 mt-1 overflow-hidden rounded-lg bg-gray-100 py-1 shadow-lg"
          >
            {options.map((option) => (
              <Listbox.Option
                key={option.name}
                value={option.value}
                className={({ active }) =>
                  cn(
                    "cursor-pointer px-4 py-2 uppercase text-gray-900 transition-colors",
                    active && "bg-gray-200"
                  )
                }
              >
                {option.name}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Portal>
    </Listbox>
  )
}

type RadioProps<T> = {
  label: string
  options: readonly [Option<T>, Option<T>]
  value: T extends (infer U)[] ? U : T
  disabled?: boolean
  onChange?: (value: T extends (infer U)[] ? U : T) => void
}

function Radio<T>({
  label,
  options,
  value,
  disabled,
  onChange
}: RadioProps<T>) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full flex-shrink-0 sm:w-56"
    >
      <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
      <div
        className={cn(
          "flex w-full gap-0.5 rounded-lg border-2 border-gray-100 p-0.5",
          disabled && "opacity-50"
        )}
      >
        {options.map((option) => (
          <RadioGroup.Option
            key={option.name}
            value={option.value}
            className="flex-1"
          >
            {({ checked, disabled }) => (
              <RadioGroup.Label
                className={cn(
                  "flex justify-center py-3 font-semibold uppercase leading-none text-gray-100",
                  checked && "rounded-md bg-gray-100 text-gray-900",
                  !disabled && "cursor-pointer"
                )}
              >
                {option.name}
              </RadioGroup.Label>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}

const Portal: React.FC<React.PropsWithChildren> = ({ children }) => {
  return createPortal(children, document.body)
}

export default Configuration
