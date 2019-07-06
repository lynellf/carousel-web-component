import Index from './carousel.svelte'

const targets = [ ...document.querySelectorAll('carousel') ]
const components = targets.map((target, index) => {
	let height
	let width

	const attributes = [ ...target.attributes ]
	const children = [ ...target.children ]
	const images = children.filter((child) => child.nodeName.toLowerCase() === 'img')

	children.forEach((node) => target.removeChild(node))
	attributes.forEach((attr) => {
		const nodeName = attr.nodeName
		const value = attr.value
		const lower = nodeName.toLowerCase()
		const isHeight = lower === 'height'
		const isWidth = lower === 'width'
		if (isHeight) height = value
		if (isWidth) width = value
	})
	return new Index({
		target,
		props: {
			height,
			width,
			images,
			index
		}
	})
})

export default components
