export const querySelectorAll = async (page, target) => {
	return page.evaluate((target) => {
		const elements = document.querySelectorAll(target);
		let results = [];

		for(let elem of elements) {
			results.push(elem.innerHTML);
		}

		return results;
	}, target);
}

export const sanitizeText = (text) => {
	if(typeof text == 'string') {
		text = text.replace(/\t/g, '');
		text = text.replace(/ \n/g, '');
		text = text.replace(/\n/g, '');
		text = text.replace(/\s/g, ' ');
		text = text.replace(/–/g, '');
	}
	return text;
}

export const toTitleCase = (text) => {
	if(typeof text == 'string') {
		const parts = text.split(' ');
		text = [...parts.map(part => part.at(0).toUpperCase() + part.slice(1).toLowerCase())].join(' ');
	}
	return text;
}

export const waitFor = (delay) => {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export const makeid = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while(counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}