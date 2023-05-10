import { NextApiRequest, NextApiResponse } from "next";

export default async function configsSubscriptionApi(req: NextApiRequest, res: NextApiResponse) {
    try {
        let { id } = req.query;
        if (!id) throw Error(`Invalid request`)
        let result = await fetch((process.env.V2RAY_SERVER) + '/client/configs/' + id, {
            headers: {
                'X-Client-IP': String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress)
            }
        });
        return res.end(await result.text());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}