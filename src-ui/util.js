export function serverRequest(action) {
    return fetch('http://localhost:1254' + action)
        .then(result => result.json());
}