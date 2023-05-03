import {decrypt} from 'crypto-js/aes';
import encodeUtf8 from 'crypto-js/enc-utf8';
import { ServerContext } from '../components/app-context';

export async function serverRequest<T=any>(server: ServerContext, action: string | { body: any, url: string }, body: any = undefined): Promise<T> {

    if (typeof action == 'object') {
        body = action['body'];
        action = action['url'];
    }

    let method = body ? 'post' : 'get';

    if (action.toLowerCase().match(/^(post|get|delete|put)\:/i)) {
        let [m, ...u] = action.split(':');
        method = m;
        action = u.join(':');
    }

    
    let response = await fetch(server.url + action, {
        method: method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + btoa(server.token),
            'Server-Node': server.node ?? ''
        }
    });

    let result = await response.json();

    if (result.encoded) {
        result = JSON.parse(decrypt(result.encoded, 'masoud').toString(encodeUtf8));
    }
    
    if (result.error)
        throw Error(result.error);

    return result;
}