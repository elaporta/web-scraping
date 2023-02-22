import puppeteer from 'puppeteer';

import { getRedticketsData } from './sources/redtickets.js';
import { getPasslineData } from './sources/passline.js';
import { getTickantelData } from './sources/tickantel.js';
import { getEntrasteData } from './sources/entraste.js';

const init = async () => {
	try {
		console.clear();
		console.log('Initializing browser');

		// Setup browser
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		// Debug options
		// page.on('console', (log) => console[log._type](log._text)); // Display internal browser console.log
		// await page.screenshot({ path: 'page.png' }); // Take browser screenshot

		await getPasslineData(page);
		await getRedticketsData(page);
		await getTickantelData(page);
		await getEntrasteData(page);

		// Close browser
		console.log('\nClosing browser');
		await browser.close();

		process.exit();
	}
	catch(error) {
		console.error(error);
		process.exit(1);
	}
}

init();