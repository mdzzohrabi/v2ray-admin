/**
 * Fetch
 * @param {string} url Url
 */
export function fetchApi(url) {
    return fetch(url).then(result => {
        return result.json();
    });
}