const puppeteer = require('puppeteer');

(async () => {
  const lp = (v) => v > 10 ? v.toString() : `0${v}`;
  const timeout = async (tsp) => new Promise((resolve) => {
    setTimeout(resolve, tsp)
  })

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Junho', 'Julho',
    'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const now = new Date();
  const browser = await puppeteer.launch({ userDataDir: './user' });
  const page = await browser.newPage();
  const [
    _, __,
    cpf,
    password,
    hour,
    orientation = 'today',
    unit
  ] = process.argv

  page.on('console', consoleObj => console.log(consoleObj.text()));
  await page.goto('https://www.smartfit.com.br/reservas', { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[id=fitness_classes_session_login]');
  await page.waitForSelector('input[id=fitness_classes_session_password]');


  await page.$eval('input[id=fitness_classes_session_login]', (el, val) => el.value = val, cpf);
  await page.$eval('input[id=fitness_classes_session_password]', (el, val) => el.value = val, password);
  await page.$eval('form', (el) => el.submit());


  const date = orientation === 'today' ? now : new Date(now.getTime() + 86400000)
  const consolidateText = `${lp(date.getDate())}/${lp(date.getMonth() + 1)} ${hour}`
  const dateParsed = `${lp(date.getDate())} ${months[date.getMonth()]}`;

  await timeout(5000);

  const days = await page.$$('a.Select__list__link.js-list-link');
  const dayElements = await Promise.all(days.map((card) => card.getProperty('innerText')));
  const dayTexts = await Promise.all(dayElements.map((el) => el.jsonValue()))
  const dayIdx = dayTexts.findIndex((t) => !!t.match(new RegExp(dateParsed, 'gi')))
  const dayItem = await days[dayIdx].asElement()

  await dayItem.evaluate((node) => node.click())


  await timeout(5000);
  await page.screenshot({path: '2.png'});
  const cards = await page.$$(".Card__item__info");

  const elements = await Promise.all(cards.map((card) => card.getProperty('innerText')));
  const texts = await Promise.all(elements.map((el) => el.jsonValue()))
  const idx = texts.findIndex((t) => !!t.match(new RegExp(consolidateText, 'gi')))

  const el = await cards[idx].asElement()

  await el.evaluate((node) =>
    node.parentNode.parentElement.querySelector('.open-sao-paulo-covid-modal').click()
  )

  const noAndNext = async () => {
    await page.$eval('.swal2-radio input', (node) => node.click());
    await page.$eval('button.swal2-confirm', (node) => node.click());
    return await timeout(100);
  }

  await noAndNext()
  await noAndNext()
  await noAndNext()
  await noAndNext()
  await noAndNext()
  await noAndNext()

  await timeout(3000);
  await page.screenshot({path: '3.png'});
  await browser.close();
})();