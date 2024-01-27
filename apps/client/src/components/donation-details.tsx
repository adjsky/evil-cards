import React from "react"
import QRCode from "react-qr-code"

import ExternalUnderlineLink from "./external-underline-link"

const DonationDetails: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col gap-4 text-gray-100">
      <ul>
        <li>
          Рубли и всякое -{" "}
          <ExternalUnderlineLink
            href="https://www.donationalerts.com/r/adjsky"
            target="_blank"
            rel="noreferrer"
          >
            DonationAlerts
          </ExternalUnderlineLink>
        </li>
        <li>
          BNB (BEP-20) -{" "}
          <ExternalUnderlineLink
            href="https://blockchair.com/bnb/address/0x80D58D656b1195C03e8C68af6Fd8Ab79973EC706"
            target="_blank"
            rel="noreferrer"
          >
            Blockchair
          </ExternalUnderlineLink>
        </li>
        <li>
          Monero (XMR):
          <QRCode
            value="monero:46rRwVG3RPKPkpKCoPf5vM1zM6QMqgG8nbqU1TYA6y9BP6SrEhZHzxjKo3JEi5zttCfdRgdudhkQ8AV2hvNPSSAs6yo1hhv"
            size={160}
          />
        </li>
      </ul>
    </div>
  )
}

export default DonationDetails
