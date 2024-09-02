import * as fs from 'fs';
import { get } from 'https';

export const saveFile = async (data, source) => {
	try {
		await fs.promises.writeFile(`./events/${source}.json`, JSON.stringify(data, null, 4));
		console.log(`> ./events/${source}.json`);
	}
	catch(error) {
		throw 'Error saving file';
	}
}

export const loadFile = async (source) => {
	try {
		const data = await fs.promises.readFile(`./events/${source}.json`, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error(`Error loading file: ./events/${source}.json`);
		return [];
	}
}

export const downloadImage = async (url, name, extension) => {
	let success = false;
  
	try {
	  const filepath = `./images/${name}.${extension}`;
	  const file = fs.createWriteStream(filepath);
  
	  // Envolver la lógica de descarga en una Promesa
	  await new Promise((resolve, reject) => {
		get(url, (response) => {
		  if (response.statusCode !== 200) {
			reject(new Error(`Error downloading image, status code: ${response.statusCode}`));
			return;
		  }
  
		  response.pipe(file);
  
		  file.on('finish', () => {
			file.close(() => {
			  success = true;
			  resolve();
			});
		  });
  
		  file.on('error', (error) => {
			reject(error);
		  });
		}).on('error', (error) => {
		  reject(error);
		});
	  });
	} catch (error) {
	  console.error(`> Error: ${error.message}`);
	} finally {
	  return success ? `${name}.${extension}` : null;
	}
  };