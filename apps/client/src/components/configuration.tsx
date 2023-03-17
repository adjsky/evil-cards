import React, { useState, useEffect } from "react"
import clsx from "clsx"
import { Listbox, Transition } from "@headlessui/react"
import ArrowDown from "@/assets/arrow-down.svg"

import type { Configuration as ConfigurationType } from "@evil-cards/server/src/lib/ws/send"

const votingPeriodOptions = [
  { value: 60, name: "НОРМАЛЬНАЯ" },
  { value: 30, name: "БЫСТРАЯ" },
  { value: 90, name: "МЕДЛЕННАЯ" }
] as const
const maxScoreOptions = [
  { value: 10, name: "10" },
  { value: 15, name: "15" },
  { value: 20, name: "20" }
] as const
const readerOptions = [
  { value: "on", name: "ЕСТЬ" },
  { value: "off", name: "НЕТ" }
] as const

const Configuration: React.FC<{
  configuration: ConfigurationType
  host?: boolean
  onSave?: (configuration: ConfigurationType) => void
}> = ({ configuration, host, onSave }) => {
  const [configurationCopy, setConfigurationCopy] = useState({
    ...configuration
  })
  useEffect(() => {
    setConfigurationCopy(configuration)
  }, [configuration])

  return (
    <div className="flex w-full flex-auto flex-col items-center gap-4">
      <h2 className="text-center text-xl font-bold text-gray-100 sm:text-3xl">
        НАСТРОЙКИ
      </h2>
      <div className="flex w-full flex-auto flex-col gap-4">
        <Row
          label="СКОРОСТЬ ИГРЫ"
          options={votingPeriodOptions}
          value={configurationCopy["votingDurationSeconds"]}
          disabled={!host}
          onChange={(votingDurationSeconds) =>
            setConfigurationCopy((prev) => ({ ...prev, votingDurationSeconds }))
          }
        />
        <Row
          label="КОЛИЧЕСТВО ОЧКОВ ДЛЯ ПОБЕДЫ"
          options={maxScoreOptions}
          value={configurationCopy["maxScore"]}
          disabled={!host}
          onChange={(maxScore) =>
            setConfigurationCopy((prev) => ({ ...prev, maxScore }))
          }
        />
        <Row
          label="ОЗВУЧКА"
          options={readerOptions}
          value={configurationCopy["reader"]}
          disabled={!host}
          onChange={(reader) =>
            setConfigurationCopy((prev) => ({ ...prev, reader }))
          }
        />
      </div>
      {host && (
        <button
          className="rounded-lg border border-gray-100 bg-gray-100 px-4 py-4 text-base leading-none text-gray-900 transition-colors hover:bg-gray-900 hover:text-gray-100 sm:px-5 sm:text-xl sm:leading-none"
          onClick={() => onSave && onSave(configurationCopy)}
          data-testid="save-configuration"
        >
          СОХРАНИТЬ
        </button>
      )}
    </div>
  )
}

type Option<T> = {
  value: T
  name: string
}
type RowProps<T> = {
  label: string
  options: readonly Option<T>[]
  value: T extends (infer U)[] ? U : T
  disabled?: boolean
  onChange?: (value: T extends (infer U)[] ? U : T) => void
}

function Row<T>({ label, options, value, disabled, onChange }: RowProps<T>) {
  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <span className="text-center text-base font-bold text-gray-100">
        {label}
      </span>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative w-full sm:w-56">
          <Listbox.Button
            className={({ disabled }) =>
              clsx(
                "flex w-full items-center justify-between gap-4 rounded-lg bg-gray-100 p-4",
                disabled && "opacity-50"
              )
            }
          >
            {({ open }) => (
              <>
                <span className="text-base font-semibold leading-none text-gray-900">
                  {options.find((option) => option.value == value)?.name}
                </span>
                <ArrowDown className={clsx(open && "rotate-180")} />
              </>
            )}
          </Listbox.Button>
          <Transition
            as={React.Fragment}
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            leave="transition ease-in duration-75"
          >
            <Listbox.Options className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg bg-gray-100 py-1">
              {options.map((option) => (
                <Listbox.Option
                  key={option.name}
                  value={option.value}
                  className={({ active }) =>
                    clsx(
                      "cursor-pointer px-4 py-2 text-gray-900 transition-colors",
                      active && "bg-gray-200"
                    )
                  }
                >
                  {option.name}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default Configuration
