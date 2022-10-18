// @ts-check

import { IncomingMessage, ServerResponse } from 'http';

/**
 * 
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @returns 
 */
export default function usersApi(req, res) {
    const {getPaths, readConfig} = require('../../../util');

    let {configPath} = getPaths();
    let config = readConfig(configPath);
    let inbounds = config?.inbounds ?? [];

    res.json({ inbounds });
}