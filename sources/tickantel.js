import * as cheerio from 'cheerio';

import { querySelectorAll, sanitizeText, waitFor } from '../helpers/utils.js';
import { saveFile } from '../helpers/file-system.js';
import { resetTimer, logElapsedTime } from '../helpers/time-events.js';

const formatTickantelEvents = (events) => {
	let results = [];

	for(let event of events) {
		const $ = cheerio.load(event);

		results.push({
			url: 'https://tickantel.com.uy/inicio' + $('a').first().attr('href').slice(1),
			img: $('img').first().attr('src'),
			title: $('p.title > span').first().text(),
			date: sanitizeText($('p.auto-pf-date').text()),
			cost: null,
			location: sanitizeText($('div.card-content > p').eq(2).text()),
			source: 'tickantel'
		});
	}

	return results;
}

export const getTickantelData = async (page) => {
	console.log('\nTickAntel: loading events...');
	resetTimer();

	let results = [];

	try {
		await page.goto('https://tickantel.com.uy/inicio/buscar_categoria?1&cat_id=2', {
			waitUntil: 'load',
			timeout: 0 // Removes the timeout
		});

		await page.evaluate(async () => {
			let continueLoading = true;

			while(continueLoading) {
				const loadMoreBtn = document.querySelector(".cargar-link");
				(loadMoreBtn) ? cargarResultados() : continueLoading = false;
				await waitFor(500);
			}
		});

		// Get events
		const events = await querySelectorAll(page, 'div.item');
		results = [...results, ...formatTickantelEvents(events)];

		// Display events
		console.log('> size:', results.length);

		// Save file
		await saveFile(results, 'tickantel');

		// Log elapsed time
		logElapsedTime();
	}
	catch(error) {
		throw error;
	}
}