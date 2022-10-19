/**
 * @param {import("./components/app-context").ServerContext} server
 * @param {string} action Action
 * @param {any} body 
 * @returns 
 */
export function serverRequest(server, action, body = undefined) {
    return fetch(server.url + action, {
        method: body ? 'POST' : 'GET',
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + btoa(server.token)
        }
    }).then(result => result.json());
}

export function store(key, value) {
    localStorage[key] = value ? JSON.stringify(value) : undefined;
}

export function stored(key) {
    try {
        return localStorage[key] ? JSON.parse(localStorage[key]) : undefined;
    } catch {
        return undefined;
    }
}