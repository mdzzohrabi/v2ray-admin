/**
 * 
 * @param {string} action Action
 * @param {any} body 
 * @returns 
 */
export function serverRequest(action, body = undefined) {
    return fetch('http://localhost:1254' + action, {
        method: body ? 'POST' : 'GET',
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(result => result.json());
}