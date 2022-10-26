import CatEyes from "../assets/cat-eyes.svg"

const Logo = () => (
  <div className="flex flex-col items-center justify-center">
    <CatEyes />
    <h1 className="text-center text-2xl font-bold leading-none text-gray-100">
      <span>500</span>{" "}
      <span className="text-4xl leading-none text-red-500">ЗЛОБНЫХ</span>{" "}
      <span>карт</span> <br /> <span className="h text-lg">онлайн</span>
    </h1>
  </div>
)

export default Logo
