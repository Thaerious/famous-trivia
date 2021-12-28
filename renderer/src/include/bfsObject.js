/**
 * Return the first object in a breadth-first-search of child objects that 
 * for a matching key:value pair.
 * Will return the root object if it has the matching key:value pair.
 * Will return undefined if no match is found.
 * The 'test' function accepts the value of key when it is found on an object.
 * It defaults to simple equivalency.
 * @param {*} root
 * @param {*} key
 * @param {*} value
 * @param {*} test (value) test function defaults for equivalency
 * @returns
 */
function bfsObject(root, key, value, test) {
    const queue = [];

    if (value) test = i => i === value;
    else test = i => i !== undefined;

    if (typeof(root) == "object") queue.push(root);
    else if (typeof(root) == "array") for (const item of root) queue.push(item);
    else return undefined;

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        if (test(current[key])) return current;
        pushObjectValues(queue, current);
    }
    return undefined;
}

function bfsAll(root, key, value, test) {
    const return_array = [];
    const queue = [];
    
    if (value) test = i => i === value;
    else test = i => i !== undefined;

    if (typeof(root) == "object") queue.push(root);
    else if (typeof(root) == "array") for (const item of root) queue.push(item);
    else return undefined;
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;        
        if (test(current[key])) return_array.push(current);
        pushObjectValues(queue, current);
    }
    return return_array;
}

function pushObjectValues(queue, current){
    if (!current) return;
    for (const prop of Object.keys(current)){
        if (typeof current[prop] == "object"){
            queue.push(current[prop]);
        }
        else if (typeof current[prop] == "array"){
            for (const item of current[prop]){
                pushObjectValues(queue, item);
            }
        }
    }
}    


export {bfsObject, bfsAll};