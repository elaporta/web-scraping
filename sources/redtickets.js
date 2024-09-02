import * as cheerio from 'cheerio';

import { querySelectorAll } from '../helpers/utils.js';
import { saveFile } from '../helpers/file-system.js';
import { resetTimer, logElapsedTime } from '../helpers/time-events.js';

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
			source: 'redtickets'
		});
	}

	return results;
}

export const getRedticketsData = async (page) => {
	console.log('\nRedTickets: loading events...');
	resetTimer();

	let results = [];

	try {
		await page.goto('https://redtickets.uy/busqueda?*,3,0', {
			waitUntil: 'load',
			timeout: 0 // Removes the timeout
		});

		// Get page paginator
		const paginator = await querySelectorAll(page, '#W0020SECTION1 > span > a');

		if(paginator.length > 1) {
			for(let i = 0; i < paginator.length; i++) {

				// Skip reload the first page
				if(i != 0){
					await page.goto(`https://redtickets.uy/busqueda?*,3,${i}`, {
						waitUntil: 'load',
						timeout: 0 // Removes the timeout
					});
				}

				// Get events
				const events = await querySelectorAll(page, 'div.card-inner');
				results = [...results, ...formatRedticketsEvents(events)];
			}
		}

		// Display events
		console.log('> length:', results.length);

		// Save file
		await saveFile(results, 'redtickets');

		// Log elapsed time
		logElapsedTime();
	}
	catch(error) {
		throw error;
	}
}