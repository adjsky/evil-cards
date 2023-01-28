const getScoreLabel = (score: number) =>
  score == 0 || score > 4 ? "очков" : score == 1 ? "очко" : "очка"

export default getScoreLabel
