/**
 * Return the first object in a breadth-first-search of child objects that
 * for a matching key:value pair.
 * Returns root if it has a matching key:value pair.
 * Returns undefined when no match is found.
 * The 'test' function accepts the value of key when it is found on an object.
 * It defaults to simple equivalency.
 * @param {*} root
 * @param {*} key
 * @param {*} value
 * @param {*} test (value) test function defaults for equivalency
 * @returns
 */
function bfsObject (root, key, value, test) {
    const queue = [];

    if (value) test = i => i === value;
    else test = i => i !== undefined;

    if (Array.isArray(root)) for (const item of root) queue.push(item);
    else if (typeof (root) === `object`) queue.push(root);
    else return undefined;

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        if (test(current[key])) return current;
        pushObjectValues(queue, current);
    }
    return undefined;
}

function bfsAll (root, key, value, test) {
    const returnArray = [];
    const queue = [];

    if (value) test = i => i === value;
    else test = i => i !== undefined;

    if (Array.isArray(root)) for (const item of root) queue.push(item);
    else if (typeof (root) === `object`) queue.push(root);
    else return undefined;

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        if (test(current[key])) returnArray.push(current);
        pushObjectValues(queue, current);
    }
    return returnArray;
}

function pushObjectValues (queue, current) {
    if (!current) return;
    for (const prop of Object.keys(current)) {
        if (typeof current[prop] === `object`) {
            queue.push(current[prop]);
        } else if (Array.isArray(current[prop])) {
            for (const item of current[prop]) {
                pushObjectValues(queue, item);
            }
        }
    }
}

export { bfsObject, bfsAll };
