import Image from "next/future/image"
import catEyes from "../assets/cat-eyes.svg"

export const Plus = () => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 23 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.3529 11.1039C11.9805 16.9575 14.4207 20.6162 12.3529 20.8628C10.2851 21.1095 9.6263 17.7196 9.9987 11.8661C10.3711 6.01252 10.5867 2.84746 12.6545 2.60077C14.7223 2.35409 12.7253 5.25039 12.3529 11.1039Z"
      fill="#D71E1E"
    />
    <path
      d="M11.5714 11.7166C17.4208 11.8182 19.7823 13.763 20.197 11.7166C20.6117 9.67023 18.3714 9.52727 12.522 9.42573C6.67269 9.3242 3.61175 9.67033 3.19704 11.7167C2.78232 13.7631 5.7221 11.6151 11.5714 11.7166Z"
      fill="#D71E1E"
    />
  </svg>
)

export const Pencil = () => (
  <svg
    width="15"
    height="21"
    viewBox="0 0 15 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.22387 15.9228C6.22387 15.9228 6.11873 15.5047 6.05126 15.2369C5.98379 14.9692 5.62204 14.9805 4.93636 15.1532C4.25069 15.3259 4.59095 13.7817 3.90516 13.9546C3.48586 14.0604 3.16251 14.0055 2.97454 13.9469C2.86912 13.914 2.83618 13.7941 2.89282 13.6993L10.2278 1.42366L12.2011 2.02032L13.6615 3.4754L6.22387 15.9228Z"
      fill="#2A2A2A"
    />
    <path
      d="M13.7334 3.43854L6.24884 15.909L2.25244 18.6723L2.80822 13.8439L10.293 1.37304C11.7108 1.44475 13.0021 2.21854 13.7334 3.43854Z"
      stroke="#2A2A2A"
      strokeWidth="0.5"
    />
    <path
      d="M2.45529 18.3307L2.62273 16.1009L4.33959 17.1268L2.45529 18.3307Z"
      fill="#2A2A2A"
    />
  </svg>
)

export const Crown = () => (
  <svg
    width={16}
    height={13}
    viewBox="0 0 16 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.2687 9.87429C10.4915 10.8 4.32009 11.1086 2.16009 9.87429L1.28823 4.06188C1.25611 3.84778 1.36544 3.63732 1.55909 3.5405L1.56538 3.53736C1.73981 3.45014 1.94904 3.4723 2.10133 3.59414L4.71638 5.68617C4.8337 5.78003 5.00672 5.74994 5.08546 5.62198L7.33259 1.9704C7.37809 1.89647 7.45869 1.85143 7.5455 1.85143H7.88325C7.97006 1.85143 8.05066 1.89647 8.09616 1.9704L10.3433 5.62198C10.422 5.74994 10.595 5.78003 10.7124 5.68617L13.5772 3.39429C13.7829 3.39429 14.1944 3.456 14.1944 3.70286C13.8858 8.02286 13.5772 7.92 13.2687 9.87429Z"
      fill="#F8C034"
    />
    <circle cx="7.71427" cy="1.23429" r="1.23429" fill="#F8C034" />
    <circle cx="1.23429" cy="3.27089" r="1.23429" fill="#F8C034" />
    <circle cx="14.1942" cy="3.27089" r="1.23429" fill="#F8C034" />
    <path
      d="M2.57141 11.1429C6.6857 12.6952 11.0476 11.7897 12.8571 11.1429"
      stroke="#F8C034"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const Question = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.0367 38.5V32.2572C21.0367 31.8131 21.3267 31.4222 21.7489 31.2846C23.7703 30.626 29.5032 28.5777 31.1586 26.0458C33.1799 22.9543 32.9866 16.0536 30.1021 13.2906C26.4662 9.80795 18.8126 9.20757 16.4139 13.6675C15.0985 16.1133 15.5898 20.8102 15.5898 20.8102"
      stroke="#555555"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
)

export const CheckMark = () => (
  <svg
    width="9"
    height="12"
    viewBox="0 0 9 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.2674 11.5C3.87068 11.5 2.50209 10.6256 0.201251 7.12781C-0.358005 6.27765 0.35993 4.74738 0.994645 5.4275C1.62936 6.10762 3.04422 8.3018 3.87068 9.31388C5.55664 5.54893 8.2126 -0.668661 8.82939 0.690947C9.82111 2.87703 6.25088 8.74714 4.2674 11.5Z"
      fill="#3BB948"
    />
  </svg>
)

export const Logo = () => (
  <div className="flex flex-col items-center justify-center">
    <Image src={catEyes} alt="" />
    <h1 className="text-center text-2xl font-bold leading-none text-gray-100">
      <span>500</span>{" "}
      <span className="text-4xl leading-none text-red-500">ЗЛОБНЫХ</span>{" "}
      <span>карт</span> <br /> <span className="h text-lg">онлайн</span>
    </h1>
  </div>
)

export const Close = ({ fill }: { fill: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 5.5L15 15.5" stroke={fill} strokeWidth="2" />
    <path d="M5 15.5L15 5.5" stroke={fill} strokeWidth="2" />
  </svg>
)

export const CrossMark = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="0.5" width="20" height="20" rx="10" fill="#DF4B4B" />
    <path
      d="M13 7.5L7 13.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 7.5L13 13.5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ExclamationMark = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="0.5" width="20" height="20" rx="10" fill="#fff" />
    <path
      d="M10 6L10 11"
      stroke="#2A2A2A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 14.5H10.01"
      stroke="#2A2A2A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Cat = () => (
  <svg
    width="33"
    height="30"
    viewBox="0 0 33 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="16.7261" cy="18.0001" rx="12.5" ry="12" fill="#2A2A2A" />
    <path
      d="M6.57312 1.1194C6.60847 1.06641 6.68692 1.06702 6.72226 1.12057L10.9314 7.4998L13.1793 11.4435C13.9415 12.7807 13.8716 14.4288 12.9995 15.6848L7.9485 22.9596C7.59336 23.4711 6.83687 23.4811 6.4605 22.9793L5.81203 22.1147C4.77928 20.7377 4.18953 19.0831 4.1213 17.3711L3.95238 13.1325C3.84316 10.3917 4.13141 7.65257 4.80822 4.99979C5.14599 3.67591 5.70544 2.41984 6.46312 1.28426L6.57312 1.1194Z"
      fill="#2A2A2A"
    />
    <path
      d="M26.1178 1.11962C26.0825 1.06663 26.004 1.06724 25.9687 1.12079L21.7595 7.50001L19.4902 11.4813C18.7392 12.7989 18.7952 14.4204 19.635 15.6714L24.3935 22.7599C24.7896 23.3499 25.6635 23.3439 26.0605 22.7485L27.6887 20.3061C28.6882 18.8069 29.1915 17.0358 29.1272 15.2438L29.0514 13.131C28.9529 10.3848 28.5612 7.65912 27.8827 5.00001C27.545 3.67613 26.9855 2.42006 26.2278 1.28448L26.1178 1.11962Z"
      fill="#2A2A2A"
    />
    <path
      d="M25.2261 15.2048L18.2261 19.2048C19.2261 19.7048 21.4178 20.9742 23.7261 20.2048C25.2261 19.7048 25.7261 16.7048 25.2261 15.2048Z"
      fill="white"
    />
    <path
      d="M23.0169 19.5232L21.3624 16.5288L22.9825 16.1023L23.0169 19.5232Z"
      fill="#2A2A2A"
    />
    <path
      d="M8.41357 15.2048L15.4136 19.2048C14.4136 19.7048 12.2218 20.9742 9.91357 20.2048C8.41357 19.7048 7.91357 16.7048 8.41357 15.2048Z"
      fill="white"
    />
    <path
      d="M10.6227 19.5232L12.2773 16.5288L10.6572 16.1023L10.6227 19.5232Z"
      fill="#2A2A2A"
    />
  </svg>
)
