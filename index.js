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

const formatEvents = (events) => {
	let results = [];

	for(let event of events){
		const $ = cheerio.load(event);

		results.push({
			url: $('a').first().attr('href'),
			img: $('figure > img').first().attr('src'),
			title: $('figcaption > h3').first().text(),
			date: sanitizeText($('figcaption > span').first().text()),
			cost: sanitizeText($('figcaption > span').first().next().text()),
			location: sanitizeText($('figcaption > span').first().next().next().text()),
		});
	}

	return results;
}

const saveFile = (data) => {
	fs.writeFile('./events.json', JSON.stringify(data), function(err) {
			if(err){
				console.log('Error saving file');
			}
			else{
				console.log('> ./events.json');
			}
		}
	);
}

const puppeteerExample = async () => {
	let results = [];

	try {
		// Setup broser
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		// page.on('console', (log) => console[log._type](log._text)); // Display browser console.log
		await page.goto('https://www.passline.com/uruguay');
		await page.goto('https://www.passline.com/eventos-presencial.php');
		// await page.waitForSelector('.grid', { visible: true });

		// Get page paginator
		let paginator = await querySelectorAll(page, 'input.btn-pag');

		if(paginator.length > 1){
			for(let i = 0; i < paginator.length; i++) {

				// Skip reload the first page
				if(i != 0){
					await page.goto(`https://www.passline.com/eventos-presencial.php?page=${i+1}`);
				}

				// Get events
				let events = await querySelectorAll(page, '.grid > li');
				results = [...results, ...formatEvents(events)];
			}
		}

		// Close browser
		await browser.close();

		// Display events
		console.log(results);
		console.log('size:', results.length);

		// Save file
		saveFile(results);
	}
	catch(error){
		console.log(error);
	}
}

puppeteerExample();