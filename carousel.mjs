function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}
function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(changed, child_ctx);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal: not_equal$$1,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/carousel.svelte generated by Svelte v3.6.4 */

function add_css() {
	var style = element("style");
	style.id = 'svelte-mkqw2-style';
	style.textContent = ".btn.btn-action.svelte-mkqw2{padding-left:0;padding-right:0;width:1.8rem;cursor:pointer}.btn.btn-action.btn-lg.svelte-mkqw2{width:2rem}.img-responsive.svelte-mkqw2{display:block;height:auto;max-width:100%}.carousel .carousel-locator:nth-of-type(1):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(1),.carousel .carousel-locator:nth-of-type(2):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(2),.carousel .carousel-locator:nth-of-type(3):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(3),.carousel .carousel-locator:nth-of-type(4):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(4),.carousel .carousel-locator:nth-of-type(5):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(5),.carousel .carousel-locator:nth-of-type(6):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(6),.carousel .carousel-locator:nth-of-type(7):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(7),.carousel .carousel-locator:nth-of-type(8):checked~.carousel-container.svelte-mkqw2 .carousel-item.svelte-mkqw2:nth-of-type(8){animation:svelte-mkqw2-carousel-slidein 0.75s ease-in-out 1;opacity:1;z-index:100}.carousel .carousel-locator:nth-of-type(1):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(1),.carousel .carousel-locator:nth-of-type(2):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(2),.carousel .carousel-locator:nth-of-type(3):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(3),.carousel .carousel-locator:nth-of-type(4):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(4),.carousel .carousel-locator:nth-of-type(5):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(5),.carousel .carousel-locator:nth-of-type(6):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(6),.carousel .carousel-locator:nth-of-type(7):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(7),.carousel .carousel-locator:nth-of-type(8):checked~.carousel-nav.svelte-mkqw2 .nav-item.svelte-mkqw2:nth-of-type(8){color:#f7f8f9}.carousel.svelte-mkqw2{background:#f7f8f9;display:block;overflow:hidden;-webkit-overflow-scrolling:touch;position:relative;width:100%;z-index:1}.carousel.svelte-mkqw2 .carousel-container.svelte-mkqw2{height:100%;left:0;position:relative}.carousel.svelte-mkqw2 .carousel-container.svelte-mkqw2::before{content:\"\";display:block;padding-bottom:56.25%}.carousel.svelte-mkqw2 .carousel-container .carousel-item.svelte-mkqw2{animation:svelte-mkqw2-carousel-slideout 1s ease-in-out 1;height:100%;left:0;margin:0;opacity:0;position:absolute;top:0;width:100%}.carousel.svelte-mkqw2 .carousel-container .carousel-item:hover .item-next.svelte-mkqw2,.carousel.svelte-mkqw2 .carousel-container .carousel-item:hover .item-prev.svelte-mkqw2{opacity:1}.carousel.svelte-mkqw2 .carousel-container .item-next.svelte-mkqw2,.carousel.svelte-mkqw2 .carousel-container .item-prev.svelte-mkqw2{background:rgba(247, 248, 249, 0.25);border-color:rgba(247, 248, 249, 0.5);color:#f7f8f9;opacity:0;position:absolute;top:50%;transform:translateY(-50%);transition:all 0.4s;z-index:100}.carousel.svelte-mkqw2 .carousel-container .item-prev.svelte-mkqw2{left:1rem}.carousel.svelte-mkqw2 .carousel-container .item-next.svelte-mkqw2{right:1rem}.carousel.svelte-mkqw2 .carousel-nav.svelte-mkqw2{bottom:0.4rem;display:flex;display:-ms-flexbox;-ms-flex-pack:center;justify-content:center;left:50%;position:absolute;transform:translateX(-50%);width:10rem;z-index:100}.carousel.svelte-mkqw2 .carousel-nav .nav-item.svelte-mkqw2{color:rgba(247, 248, 249, 0.5);display:block;-ms-flex:1 0 auto;flex:1 0 auto;height:1.6rem;margin:0.2rem;max-width:2.5rem;position:relative}.carousel.svelte-mkqw2 .carousel-nav .nav-item.svelte-mkqw2::before{background:currentColor;content:\"\";display:block;height:0.1rem;position:absolute;top:0.5rem;width:100%}@keyframes svelte-mkqw2-carousel-slidein{0%{transform:translateX(100%)}100%{transform:translateX(0)}}@keyframes svelte-mkqw2-carousel-slideout{0%{opacity:1;transform:translateX(0)}100%{opacity:1;transform:translateX(-50%)}}.icon.svelte-mkqw2{box-sizing:border-box;display:inline-block;font-family:sans-serif;font-weight:800;font-size:20px;font-style:normal;height:1em;position:relative;text-indent:-9999px;vertical-align:middle;width:1em;cursor:pointer}.icon.svelte-mkqw2::before,.icon.svelte-mkqw2::after{content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translate(-50%, -50%)}.icon-arrow-left.svelte-mkqw2::before,.icon-arrow-right.svelte-mkqw2::before{border:0.1rem solid currentColor;border-bottom:0;border-right:0;height:0.65em;width:0.65em}.icon-arrow-left.svelte-mkqw2::before{transform:translate(-25%, -50%) rotate(-45deg)}.icon-arrow-right.svelte-mkqw2::before{transform:translate(-75%, -50%) rotate(135deg)}.btn.btn-lg.svelte-mkqw2{font-size:0.9rem;height:2rem;padding:0.35rem 0.6rem}.btn.btn-action.btn-lg.svelte-mkqw2{width:2rem}.text-hide.svelte-mkqw2{background:transparent;border:0;color:transparent;font-size:0;line-height:0;text-shadow:none}.c-hand.svelte-mkqw2{cursor:pointer}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.image = list[i];
	child_ctx.i = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.src = list[i].src;
	child_ctx.alt = list[i].alt;
	child_ctx.i = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.image = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (264:2) {#each images as image, i (image.src)}
function create_each_block_2(key_1, ctx) {
	var input, input_id_value, input_checked_value;

	return {
		key: key_1,

		first: null,

		c() {
			input = element("input");
			attr(input, "type", "radio");
			attr(input, "class", "carousel-locator svelte-mkqw2");
			attr(input, "name", "carousel-radio");
			input.hidden = "true";
			attr(input, "id", input_id_value = `slide-${ctx.i + 1}-carousel${ctx.index}`);
			input.checked = input_checked_value = ctx.i === 0 ? 'true' : 'false';
			this.first = input;
		},

		m(target_1, anchor) {
			insert(target_1, input, anchor);
		},

		p(changed, ctx) {
			if ((changed.images || changed.index) && input_id_value !== (input_id_value = `slide-${ctx.i + 1}-carousel${ctx.index}`)) {
				attr(input, "id", input_id_value);
			}

			if ((changed.images) && input_checked_value !== (input_checked_value = ctx.i === 0 ? 'true' : 'false')) {
				input.checked = input_checked_value;
			}
		},

		d(detaching) {
			if (detaching) {
				detach(input);
			}
		}
	};
}

// (274:4) {#each images as { src, alt }
function create_each_block_1(key_1, ctx) {
	var figure, label0, i0, label0_for_value, t0, label1, i1, label1_for_value, t1, img, img_src_value, img_alt_value, t2;

	return {
		key: key_1,

		first: null,

		c() {
			figure = element("figure");
			label0 = element("label");
			i0 = element("i");
			t0 = space();
			label1 = element("label");
			i1 = element("i");
			t1 = space();
			img = element("img");
			t2 = space();
			attr(i0, "class", "icon icon-arrow-left svelte-mkqw2");
			attr(label0, "for", label0_for_value = `slide-${ctx.i === 0 ? ctx.images.length : ctx.i}-carousel${ctx.index}`);
			attr(label0, "class", "item-prev btn btn-action btn-lg svelte-mkqw2");
			attr(i1, "class", "icon icon-arrow-right svelte-mkqw2");
			attr(label1, "for", label1_for_value = `slide-${ctx.i + 1 === ctx.images.length ? 1 : ctx.i + 2}-carousel${ctx.index}`);
			attr(label1, "class", "item-next btn btn-action btn-lg svelte-mkqw2");
			attr(img, "class", "img-responsive rounded svelte-mkqw2");
			attr(img, "src", img_src_value = ctx.src);
			attr(img, "alt", img_alt_value = ctx.alt);
			attr(figure, "class", "carousel-item svelte-mkqw2");
			this.first = figure;
		},

		m(target_1, anchor) {
			insert(target_1, figure, anchor);
			append(figure, label0);
			append(label0, i0);
			append(figure, t0);
			append(figure, label1);
			append(label1, i1);
			append(figure, t1);
			append(figure, img);
			append(figure, t2);
		},

		p(changed, ctx) {
			if ((changed.images || changed.index) && label0_for_value !== (label0_for_value = `slide-${ctx.i === 0 ? ctx.images.length : ctx.i}-carousel${ctx.index}`)) {
				attr(label0, "for", label0_for_value);
			}

			if ((changed.images || changed.index) && label1_for_value !== (label1_for_value = `slide-${ctx.i + 1 === ctx.images.length ? 1 : ctx.i + 2}-carousel${ctx.index}`)) {
				attr(label1, "for", label1_for_value);
			}

			if ((changed.images) && img_src_value !== (img_src_value = ctx.src)) {
				attr(img, "src", img_src_value);
			}

			if ((changed.images) && img_alt_value !== (img_alt_value = ctx.alt)) {
				attr(img, "alt", img_alt_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(figure);
			}
		}
	};
}

// (291:4) {#each images as image, i (image.src)}
function create_each_block(key_1, ctx) {
	var label, t0_value = ctx.i + 1, t0, t1, label_for_value;

	return {
		key: key_1,

		first: null,

		c() {
			label = element("label");
			t0 = text(t0_value);
			t1 = space();
			attr(label, "for", label_for_value = `slide-${ctx.i + 1}-carousel${ctx.index}`);
			attr(label, "class", "nav-item text-hide c-hand svelte-mkqw2");
			this.first = label;
		},

		m(target_1, anchor) {
			insert(target_1, label, anchor);
			append(label, t0);
			append(label, t1);
		},

		p(changed, ctx) {
			if ((changed.images) && t0_value !== (t0_value = ctx.i + 1)) {
				set_data(t0, t0_value);
			}

			if ((changed.images || changed.index) && label_for_value !== (label_for_value = `slide-${ctx.i + 1}-carousel${ctx.index}`)) {
				attr(label, "for", label_for_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(label);
			}
		}
	};
}

function create_fragment(ctx) {
	var div2, each_blocks_2 = [], each0_lookup = new Map(), t0, div0, each_blocks_1 = [], each1_lookup = new Map(), t1, div1, each_blocks = [], each2_lookup = new Map(), div2_style_value;

	var each_value_2 = ctx.images;

	const get_key = ctx => ctx.image.src;

	for (var i = 0; i < each_value_2.length; i += 1) {
		let child_ctx = get_each_context_2(ctx, each_value_2, i);
		let key = get_key(child_ctx);
		each0_lookup.set(key, each_blocks_2[i] = create_each_block_2(key, child_ctx));
	}

	var each_value_1 = ctx.images;

	const get_key_1 = ctx => ctx.src;

	for (var i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i);
		let key = get_key_1(child_ctx);
		each1_lookup.set(key, each_blocks_1[i] = create_each_block_1(key, child_ctx));
	}

	var each_value = ctx.images;

	const get_key_2 = ctx => ctx.image.src;

	for (var i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key_2(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div2 = element("div");

			for (i = 0; i < each_blocks_2.length; i += 1) each_blocks_2[i].c();

			t0 = space();
			div0 = element("div");

			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();

			t1 = space();
			div1 = element("div");

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			attr(div0, "class", "carousel-container svelte-mkqw2");
			attr(div1, "class", "carousel-nav svelte-mkqw2");
			attr(div2, "class", "carousel svelte-mkqw2");
			attr(div2, "style", div2_style_value = `height: ${ctx.height}; width: ${ctx.width};`);
		},

		m(target_1, anchor) {
			insert(target_1, div2, anchor);

			for (i = 0; i < each_blocks_2.length; i += 1) each_blocks_2[i].m(div2, null);

			append(div2, t0);
			append(div2, div0);

			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].m(div0, null);

			append(div2, t1);
			append(div2, div1);

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div1, null);
		},

		p(changed, ctx) {
			const each_value_2 = ctx.images;
			each_blocks_2 = update_keyed_each(each_blocks_2, changed, get_key, 1, ctx, each_value_2, each0_lookup, div2, destroy_block, create_each_block_2, t0, get_each_context_2);

			const each_value_1 = ctx.images;
			each_blocks_1 = update_keyed_each(each_blocks_1, changed, get_key_1, 1, ctx, each_value_1, each1_lookup, div0, destroy_block, create_each_block_1, null, get_each_context_1);

			const each_value = ctx.images;
			each_blocks = update_keyed_each(each_blocks, changed, get_key_2, 1, ctx, each_value, each2_lookup, div1, destroy_block, create_each_block, null, get_each_context);

			if ((changed.height || changed.width) && div2_style_value !== (div2_style_value = `height: ${ctx.height}; width: ${ctx.width};`)) {
				attr(div2, "style", div2_style_value);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			for (i = 0; i < each_blocks_2.length; i += 1) each_blocks_2[i].d();

			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].d();

			for (i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { target, height, width, images, index } = $$props;

	$$self.$set = $$props => {
		if ('target' in $$props) $$invalidate('target', target = $$props.target);
		if ('height' in $$props) $$invalidate('height', height = $$props.height);
		if ('width' in $$props) $$invalidate('width', width = $$props.width);
		if ('images' in $$props) $$invalidate('images', images = $$props.images);
		if ('index' in $$props) $$invalidate('index', index = $$props.index);
	};

	return { target, height, width, images, index };
}

class Carousel extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-mkqw2-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["target", "height", "width", "images", "index"]);
	}
}

const targets = [ ...document.querySelectorAll('carousel') ];
const components = targets.map((target, index) => {
	let height;
	let width;

	const attributes = [ ...target.attributes ];
	const children = [ ...target.children ];
	const images = children.filter((child) => child.nodeName.toLowerCase() === 'img');

	children.forEach((node) => target.removeChild(node));
	attributes.forEach((attr) => {
		const nodeName = attr.nodeName;
		const value = attr.value;
		const lower = nodeName.toLowerCase();
		const isHeight = lower === 'height';
		const isWidth = lower === 'width';
		if (isHeight) height = value;
		if (isWidth) width = value;
	});
	return new Carousel({
		target,
		props: {
			height,
			width,
			images,
			index
		}
	})
});

export default components;
