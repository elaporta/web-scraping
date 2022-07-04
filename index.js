import * as fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const querySelectorAll = async (page, target) => {
	return page.evaluate((target) => {
		const elements = document.querySelectorAll(target);
		let results = [];

		for(let elem of elements){
			results.push(elem.innerHTML);
		}

		return results;
	}, target);
}

const sanitizeText = (text) => {
	if(typeof text == 'string'){
		text = text.replace(/\t/g, '');
		text = text.replace(/ \n/g, '');
		text = text.replace(/\n/g, '');
	}
	return text;
}

const formatPasslineEvents = (events) => {
	let results = [];

	for(let event of events) {
		const $ = cheerio.load(event);
		let cost = sanitizeText($('figcaption > span').first().next().text());
		cost = (cost.includes('$')) ? cost : null;

		results.push({
			url: $('a').first().attr('href'),
			img: $('figure > img').first().attr('src'),
			title: $('figcaption > h3').first().text(),
			date: sanitizeText($('figcaption > span').first().text()),
			cost: cost,
			location: sanitizeText($('figcaption > span').first().next().next().text()),
			platform: 'passline'
		});
	}

	return results;
}

const formatRedticketsEvents = (events) => {
	let results = [];

	for(let event of events) {
		const $ = cheerio.load(event);

		results.push({
			url: 'https://redtickets.uy' + $('a').first().attr('href'),
			img: 'https://redtickets.uy' + $('img').first().attr('src'),
			title: $('.EventTitle').first().text(),
			date: $('.EventInfo').eq(0).text(),
			cost: null,
			location: $('.EventInfo').eq(1).text(),
			platform: 'redtickets'
		});
	}

	return results;
}

const saveFile = (data, source) => {
	fs.writeFile(`./events/${source}.json`, JSON.stringify(data, null, 4), function(err) {
			if(err) {
				console.log('Error saving file');
			}
			else {
				console.log(`> ./events/${source}.json`);
			}
		}
	);
}

const getPasslineData = async () => {
	let results = [];

	try {
		// Setup browser
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto('https://www.passline.com/uruguay');
		await page.goto('https://www.passline.com/eventos-presencial.php');
		// await page.screenshot({ path: 'page.png' });
		// page.on('console', (log) => console[log._type](log._text)); // Display browser console.log

		// Get page paginator
		const paginator = await querySelectorAll(page, 'input.btn-pag');

		if(paginator.length > 1){
			for(let i = 0; i < paginator.length; i++) {

				// Skip reload the first page
				if(i != 0){
					await page.goto(`https://www.passline.com/eventos-presencial.php?page=${i+1}`);
				}

				// Get events
				const events = await querySelectorAll(page, '.grid > li');
				results = [...results, ...formatPasslineEvents(events)];
			}
		}

		// Close browser
		await browser.close();

		// Display events
		console.log(results);
		console.log('size:', results.length);

		// Save file
		saveFile(results, 'passline');
	}
	catch(error) {
		console.log(error);
	}
}

const getRedticketsData = async () => {
	let results = [];

	try {
		// Setup browser
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto('https://redtickets.uy/busqueda?*,3,0');
		await page.waitForTimeout(5000);
		// page.on('console', (log) => console[log._type](log._text));

		// Get page paginator
		const paginator = await querySelectorAll(page, '#W0020SECTION1 > span > a');

		if(paginator.length > 1) {
			for(let i = 0; i < paginator.length; i++) {

				// Skip reload the first page
				if(i != 0){
					await page.goto(`https://redtickets.uy/busqueda?*,3,${i}`);
					await page.waitForTimeout(5000);
				}

				// Get events
				const events = await querySelectorAll(page, 'div.card-inner');
				results = [...results, ...formatRedticketsEvents(events)];
			}
		}

		// Close browser
		await browser.close();

		// Display events
		console.log(results);
		console.log('size:', results.length);

		// Save file
		saveFile(results, 'redtickets');
	}
	catch(error) {
		console.log(error);
	}
}

getPasslineData();
// getRedticketsData();