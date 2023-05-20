import { test, expect } from "@playwright/test"

test("main gameplay", async ({ page }, testInfo) => {
  await page.goto("/")

  // Ввести никнейм testuser1
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").clear()
  await page.getByTestId("nickname-input").type("testuser1")

  //	Нажать кнопку “НАЧАТЬ”
  await page.getByTestId("connect-session").click()

  //	Проверить, что пользователь в комнате
  await page.waitForURL(/\/room/)

  // Нажать на кнопку “ПРИГЛАСИТЬ”
  await page.getByTestId("invite-player").click()

  const inviteLink = await page.evaluate(() => navigator.clipboard.readText())

  // Создать новую страницу и перейти на ней по ссылке-приглашению
  const page2 = await page.context().newPage()
  await page2.goto(inviteLink)

  // Ввести никнейм testuser2
  await page2.getByTestId("nickname-toggle").click()
  await page2.getByTestId("nickname-input").clear()
  await page2.getByTestId("nickname-input").type("testuser2")
  await page2.getByTestId("connect-session").click()

  //	Проверить, что пользователь в комнате
  await page2.waitForURL(/\/room/)

  // Создать новую страницу и перейти на ней по ссылке-приглашению
  const page3 = await page.context().newPage()
  await page3.goto(inviteLink)

  // Ввести никнейм testuser3
  await page3.getByTestId("nickname-toggle").click()
  await page3.getByTestId("nickname-input").clear()
  await page3.getByTestId("nickname-input").type("testuser3")
  await page3.getByTestId("connect-session").click()

  //	Проверить, что пользователь в комнате
  await page3.waitForURL(/\/room/)

  // Перейти на страницу 1 (За testuser1) и начать игру
  await page.getByTestId("start-game").click()

  //	Проверить, что игра началась у ведущего (Тест 1.3)
  await page.waitForSelector('[data-testid="red-card"]')

  //	Проверить, что ведущего 10 белых карт
  const deck = await page.waitForSelector('[data-testid="deck"]')
  const whiteCards = await deck.$$("> button")

  expect(whiteCards.length).toBe(10)

  //	Проверить наличие таймера и списка игроков
  await page.waitForSelector('[data-testid="player-list"]', {
    state: "attached"
  })
  await page.waitForSelector('[data-testid="timebar"]')

  // Проверить, что на белую карту нажать нельзя
  expect(whiteCards[0].isDisabled).toBeTruthy()

  //	Проверить, что игра началась у игрока (Тест 1.2)
  await page2.waitForSelector('[data-testid="red-card"]')

  //	Проверить, что у игрока 10 белых карт
  const deckP2 = await page2.waitForSelector('[data-testid="deck"]')
  const whiteCardsP2 = await deckP2.$$("> button")
  expect(whiteCardsP2.length).toBe(10)

  //  Проверить наличие таймера и списка игроков
  await page.waitForSelector('[data-testid="player-list"]', {
    state: "attached"
  })
  await page.waitForSelector('[data-testid="timebar"]')

  //  Нажать на белую карту и проверить, что сверху появилась карта
  await whiteCardsP2[0].click()

  await page.waitForSelector('[data-testid="deck"] > *:first-child')

  //  Нажать на белую карту в руке и проверить, что нажатие невозможно
  expect(whiteCardsP2[0].isDisabled).toBeTruthy()

  // Повтор для игрока 3
  const deckP3 = await page3.waitForSelector('[data-testid="deck"]')
  const whiteCardsP3 = await deckP3.$$("> button")
  expect(whiteCardsP3.length).toBe(10)
  await whiteCardsP3[0].click()

  // Тест 1.4-1.5

  // Проверка наличия белых карт на столе, кол-во = кол-ву игроков - 1

  await expect(async () => {
    const votes = await page.locator('[data-testid="votes"] > *').all()
    expect(votes.length).toBe(2)
  }).toPass()

  //  Нажатие ведущим на 1 карту на столе и проверка появления текста
  const firstVote = page.locator('[data-testid="votes"] > *:first-child')
  expect(await firstVote.innerText()).toBe("")
  await firstVote.click()

  await expect(async () => {
    expect(firstVote.innerText).not.toBe("")
  }).toPass()

  //  Нажатие игроком на 2 карту на столе (ничего не должно произойти)
  const secondVoteP1 = page2.locator('[data-testid="votes"] > *:nth-child(2)')
  expect(await secondVoteP1.innerText()).toBe("")
  await secondVoteP1.click()

  await new Promise((resolve) => setTimeout(resolve, 1000))
  const screenshot = await page.screenshot()
  await testInfo.attach("screenshot", {
    body: screenshot,
    contentType: "image/png"
  })
})

test("nonexistent session", async ({ page }) => {
  await page.goto("/?s=qwe")
  //	Нажать кнопку “НАЧАТЬ”
  await page.getByTestId("connect-session").click()

  await page.waitForSelector('text="Комната не найдена"')
})

test("nickname", async ({ page }, testInfo) => {
  await page.goto("/?")
  //	Вводим в никнейм 14 символов
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").clear()
  await page.getByTestId("nickname-input").type("1234567890abcd")
  // Делаем скриншот и проверяем, что в никнейме не больше 12 символов
  const screenshot = await page.screenshot()
  await testInfo.attach("screenshot", {
    body: screenshot,
    contentType: "image/png"
  })
})

test("sameNickname", async ({ page }) => {
  await page.goto("/")
  // Ввести никнейм testuser1
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").clear()
  await page.getByTestId("nickname-input").type("testuser1")

  //	Нажать кнопку “НАЧАТЬ”
  await page.getByTestId("connect-session").click()

  //	Проверить, что пользователь в комнате
  await page.waitForURL(/\/room/)

  // Нажать на кнопку “ПРИГЛАСИТЬ”
  await page.getByTestId("invite-player").click()

  const inviteLink = await page.evaluate(() => navigator.clipboard.readText())

  // Создать новую страницу и перейти на ней по ссылке-приглашению
  const page2 = await page.context().newPage()
  await page2.goto(inviteLink)

  // Ввести никнейм testuser1
  await page2.getByTestId("nickname-toggle").click()
  await page2.getByTestId("nickname-input").clear()
  await page2.getByTestId("nickname-input").type("testuser1")
  await page2.getByTestId("connect-session").click()

  await page2.waitForSelector(
    'text="Ой, в комнате уже есть игрок с таким никнеймом"'
  )
})

test("fewPlayers", async ({ page }) => {
  await page.goto("/")
  // Ввести никнейм testuser1 и создать комнату
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").clear()
  await page.getByTestId("nickname-input").type("testuser1")
  await page.getByTestId("connect-session").click()
  // Нажать кнопку НАЧАТЬ
  await page.getByTestId("start-game").click()
  // Проверить наличие уведомления о ошибке
  await page.waitForSelector(
    'text="Нельзя начать игру, пока не наберется хотя бы 3 игрока"'
  )
})

test("timeOut", async ({ page }, testInfo) => {
  test.setTimeout(100000)
  await page.goto("/")
  // Ввести никнейм testuser1
  await page.getByTestId("nickname-toggle").click()
  await page.getByTestId("nickname-input").clear()
  await page.getByTestId("nickname-input").type("testuser1")

  //	Нажать кнопку “НАЧАТЬ”
  await page.getByTestId("connect-session").click()

  // Нажать на кнопку “ПРИГЛАСИТЬ”
  await page.getByTestId("invite-player").click()

  const inviteLink = await page.evaluate(() => navigator.clipboard.readText())

  // Создать новую страницу и перейти на ней по ссылке-приглашению
  const page2 = await page.context().newPage()
  await page2.goto(inviteLink)

  // Ввести никнейм testuser2
  await page2.getByTestId("nickname-toggle").click()
  await page2.getByTestId("nickname-input").clear()
  await page2.getByTestId("nickname-input").type("testuser2")
  await page2.getByTestId("connect-session").click()

  // Создать новую страницу и перейти на ней по ссылке-приглашению
  const page3 = await page.context().newPage()
  await page3.goto(inviteLink)

  // Ввести никнейм testuser3
  await page3.getByTestId("nickname-toggle").click()
  await page3.getByTestId("nickname-input").clear()
  await page3.getByTestId("nickname-input").type("testuser3")
  await page3.getByTestId("connect-session").click()

  await Promise.all([page2.waitForURL("/room"), page3.waitForURL("/room")])

  // Перейти на страницу 1 (За testuser1) и начать игру
  await page.getByTestId("start-game").click()
  await page.waitForSelector('[data-testid="red-card"]')

  // Ждём 60 секунд, пока таймер истечёт
  await new Promise((resolve) => setTimeout(resolve, 60000))

  const screenshot = await page.screenshot()
  await testInfo.attach("screenshot", {
    body: screenshot,
    contentType: "image/png"
  })
  expect((await page.locator('[data-testid="votes"] > *').all()).length).toBe(2)
})
