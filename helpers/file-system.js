import * as fs from 'fs';

export const saveFile = async (data, source) => {
	try {
		await fs.promises.writeFile(`./events/${source}.json`, JSON.stringify(data, null, 4));
		console.log(`> ./events/${source}.json`);
	}
	catch(error) {
		throw 'Error saving file';
	}
}