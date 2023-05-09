let messages = require('./fa').default;

export function setLocaleMessages(_messages?: any) {
    messages = _messages;
}

export function __(value?: string) {
    return messages[value] ?? value;
}