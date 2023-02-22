export const querySelectorAll = async (page, target) => {
	return page.evaluate((target) => {
		const elements = document.querySelectorAll(target);
		let results = [];

		for(let elem of elements){
			results.push(elem.innerHTML);
		}

		return results;
	}, target);
}

export const sanitizeText = (text) => {
	if(typeof text == 'string'){
		text = text.replace(/\t/g, '');
		text = text.replace(/ \n/g, '');
		text = text.replace(/\n/g, '');
		text = text.replace(/\s/g, ' ');
		text = text.replace(/–/g, '');
	}
	return text;
}