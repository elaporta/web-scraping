import * as cheerio from 'cheerio';

import { querySelectorAll, sanitizeText } from '../helpers/utils.js';
import { saveFile } from '../helpers/file-system.js';
import { resetTimer, logElapsedTime } from '../helpers/time-events.js';

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

export const getPasslineData = async (page) => {
	console.log('\nPassline: loading events...');
	resetTimer();

	let results = [];

	try {
		await page.goto('https://www.passline.com/uruguay', {
			waitUntil: 'load',
			timeout: 0 // Removes the timeout
		});
		await page.goto('https://www.passline.com/eventos-presencial.php', {
			waitUntil: 'load',
			timeout: 0 // Removes the timeout
		});

		// Get page paginator
		const paginator = await querySelectorAll(page, 'input.btn-pag');

		if(paginator.length > 1){
			for(let i = 0; i < paginator.length; i++) {

				// Skip reload the first page
				if(i != 0){
					await page.goto(`https://www.passline.com/eventos-presencial.php?page=${i+1}`, {
						waitUntil: 'load',
						timeout: 0 // Removes the timeout
					});
				}

				// Get events
				const events = await querySelectorAll(page, '.grid > li');
				results = [...results, ...formatPasslineEvents(events)];
			}
		}

		// Display events
		console.log('> size:', results.length);

		// Save file
		await saveFile(results, 'passline');

		// Log elapsed time
		logElapsedTime();
	}
	catch(error) {
		throw error;
	}
}