import * as cheerio from 'cheerio';

import { querySelectorAll, waitFor, toTitleCase, makeid } from '../helpers/utils.js';
import { saveFile, loadFile, downloadImage } from '../helpers/file-system.js';
import { resetTimer, logElapsedTime } from '../helpers/time-events.js';

export const getRaddiosData = async (page) => {
	console.log('\nRaddios: loading events...');
	resetTimer();

	let results = await loadFile('raddios');
    let country = 'Argentina';

    if(process.argv[2]) {
        const [ arg, value ] = process.argv[2].split('=');
        if(arg.toLowerCase() === '--country' && value) country = value;
    }

    if(!results || results.length == 0) {
        try {
            results = [];
            await page.goto(`https://www.raddios.com/${country}?page=1`, {
                waitUntil: 'load',
                timeout: 0 // Removes the timeout
            });
    
            await waitFor(2000);

            // Get last page link
            const lastPageLink = await querySelectorAll(page, 'ul.pagination > li:last-child');
            const lastPageNumber = (lastPageLink.length > 0) ? parseInt(lastPageLink[0].match(/\?page=(\d+)/)[1]) : 0;
    
            if(lastPageNumber > 0){
                for(let i = 1; i <= lastPageNumber; i++) {
    
                    // Skip reload the first page
                    if(i != 1){
                        await page.goto(`https://www.raddios.com/${country}?page=${i}`, {
                            waitUntil: 'load',
                            timeout: 0 // Removes the timeout
                        });
                    }
    
                    await waitFor(2000);

                    // Get radios
                    const radios = await querySelectorAll(page, 'div.column3 > div.logo_sec');
                    results = [...results, ...await formatRaddiosEvents(radios, country)];
                }
            }
    
            // Save file
            await saveFile(results, 'raddios');
        }
        catch(error) {
            throw error;
        }
    }

    // Display radios
    console.log('> length:', results.length);

    // Get radios streams
    console.log('\nRaddios: loading streams...');
    await getRadiosStreams(page, results);

    // Get radios details
    console.log('\nRaddios: loading details...');
    await getRadiosDetails(page, results);

    // Download radios images
    console.log('\nRaddios: downloading images...');
    await downloadRadiosimages(results);

    // Log elapsed time
    logElapsedTime();
}

const formatRaddiosEvents = async (radios, country) => {
	let results = [];

    const countries = {
        'Argentina': 'ARG',
        'Uruguay': 'URY',
        'Chile': 'CHL',
        'Brasil': 'BRA',
        'Espana': 'ESP',
        'Estados-Unidos': 'USA'
    };

    const countryCode = (countries[country]) ? countries[country] : null;

	for(let radio of radios) {
		const $ = cheerio.load(radio);

		results.push({
			url:  `https://www.raddios.com${$('a').first().attr('href')}`,
            img: null,
			img_url: $('img').first().attr('src'),
			title: $('img').first().attr('title'),
            stream: null,
            country: countryCode,
            location: [],
            genres: [],
            ranking: null,
            description: null,
            web: null,
			source: 'raddios'
		});
	}

	return results;
}

const getRadiosStreams = async (page, radios) => {
    let results = [];
    let i = 0;
    const methodTimeOut = 2000;

    for(let radio of radios) {
        i++;
        const radioId = radio.url.split('/')[3].split('-')[0];
        const playerUrl = `http://play.raddios.com/player_popup.php?r=${radioId}`;

        if(!radio.stream) {
            console.log('\n> progress:', `${i} of ${radios.length}`);
            console.log('> title:', radio.title);
            console.log('> url:', radio.url);
            console.log('> player:', playerUrl);

            try {
                let stream = null;

                await page.goto(playerUrl, {
                    waitUntil: 'load',
                    timeout: methodTimeOut
                });

                // Get frames
                const frames = (await page.frames());

                for(let frame of frames) {
                    if(await frame.name()) {
                        continue;
                    }

                    // Click the player link
                    const linkFound = await frame.evaluate(() => {
                        const playerLink = document.querySelector('a[title="Player Raddios"]');
                        if(playerLink) {
                            playerLink.click();
                            return true;
                        }
                        return false;
                    });

                    if(linkFound) {
                        await waitFor(methodTimeOut);

                        // Get the href from a#radio-url
                        stream = await frame.evaluate(() => {
                            const radioUrlElement = document.querySelector('a#radio-url');
                            return radioUrlElement ? radioUrlElement.href : null;
                        });

                        if(stream) {
                            console.log('> stream:', stream);
                            break;
                        }
                    }
                }

                radio.stream = stream;
            }
            catch(error) {
                // console.error('> Error loading the page, skipping..');
                console.error('> Error:', error);
            }
            
        }

        results = [...results, radio];
    }

    // Save file
    await saveFile(results, 'raddios');
}

const getRadiosDetails = async (page, radios) => {
    let results = [];
    let i = 0;
    const methodTimeOut = 5000;
    const countries = {
        'ARG': 'Argentina',
        'URY': 'Uruguay',
        'CHL': 'Chile',
        'BRA': 'Brasil',
        'ESP': 'España',
        'USA': 'Estados Unidos'
    };

    for(let radio of radios) {
        i++;

        if(!radio.location || radio.genres.length == 0 || !radio.ranking || !radio.web) {
            console.log('\n> progress:', `${i} of ${radios.length}`);
            console.log('> title:', radio.title);
            console.log('> url:', radio.url);

            try {
                await page.goto(radio.url, {
                    waitUntil: 'load',
                    timeout: methodTimeOut
                });

                const radioInformation = await querySelectorAll(page, 'div#radio-tab-3 > div.row > div.col-sm-6 > div.row > div.col-sm-12');

                const location = cheerio.load(radioInformation[2].trim());
                const genres = cheerio.load(radioInformation[1].trim());
                const description = cheerio.load(radioInformation[0].trim());
                const web = cheerio.load(radioInformation[5].trim());
                // const info = cheerio.load(radioInformation[4].trim());

                if(location('b').first().text().trim() === 'Ubicación') {
                    radio.location = [...location('p > a')].map(el => toTitleCase(location(el).text().trim()));
                    radio.location[0] = countries[radio.country];
                }
                if(genres('b').first().text().trim() === 'Géneros') {
                    radio.genres = [...genres('p > a')].map(el => genres(el).text().trim().toLowerCase());
                    if(radio.genres.length === 0) radio.genres = ['unknown'];
                }
                radio.ranking = i;
                if(description('b').first().text().trim() === 'Descripción') radio.description = description('p').first().text().trim();
                if(radio.description === 'Actualizar campo') radio.description = null;
                if(web('p').first().text().includes('web')) radio.web = web('p > a').first().attr('href');

                console.log('> details: ok');
            }
            catch(error) {
                console.error('> Error:', error);
            }
            
        }

        results = [...results, radio];
    }

    // Save file
    await saveFile(results, 'raddios');
}

const downloadRadiosimages = async (radios) => {
    let results = [];
    let i = 0;

    for(let radio of radios) {
        i++;
        console.log('\n> progress:', `${i} of ${radios.length}`);
        console.log('> title:', radio.title);

        if(!radio.img) {
            console.log(`> downloading: ${radio.img_url}`);
            radio.img = await downloadImage(radio.img_url, makeid(8), 'webp');
        }
        results = [...results, radio];
    }

    // Save file
    await saveFile(results, 'raddios');
}