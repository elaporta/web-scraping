import * as cheerio from 'cheerio';

import { querySelectorAll } from '../helpers/utils.js';
import { saveFile } from '../helpers/file-system.js';
import { resetTimer, logElapsedTime } from '../helpers/time-events.js';

const formatEntrasteEvents = (events) => {
	let results = [];

	for(let event of events) {
		const $ = cheerio.load(event);

		results.push({
			url: 'https://entraste.com/' + $('a').first().attr('href').slice(1),
			img: $('img').first().attr('src'),
			title: $('h1.event-info-title').first().text(),
			date: $('div.event-dates > p').first().text().trim(),
			cost: null,
			location: null,
			source: 'entraste'
		});
	}

	return results;
}

export const getEntrasteData = async (page) => {
	console.log('\nEntraste: loading events...');
	resetTimer();

	let results = [];

	try {
		await page.goto('https://entraste.com/', {
			waitUntil: 'load',
			timeout: 0 // Removes the timeout
		});

		// Get events
		const events = await querySelectorAll(page, 'div.event-card-wrapper');
		results = [...results, ...formatEntrasteEvents(events)];

		// Display events
		console.log('> length:', results.length);

		// Save file
		await saveFile(results, 'entraste');

		// Log elapsed time
		logElapsedTime();
	}
	catch(error) {
		throw error;
	}
}