import { NextApiRequest, NextApiResponse } from "next";

export default async function accountApi(req: NextApiRequest, res: NextApiResponse) {
    try {
        let { id } = req.body;
        let result = await fetch((process.env.V2RAY_SERVER) + '/client/info/' + id, {
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json(await result.json());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}