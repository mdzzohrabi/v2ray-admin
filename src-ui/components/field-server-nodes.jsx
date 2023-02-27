// @ts-check

import React, { useContext } from "react";
import useSWR from "swr";
import { styles } from "../lib/styles";
import { serverRequest } from "../lib/util";
import { AppContext } from "./app-context";
import { Field } from "./fields";

export function FieldServerNodes() {

    let context = useContext(AppContext);

    /** @type {import("swr").SWRResponse<ServerNode[]>} */
    let {data: nodes, mutate: refreshNodes} = useSWR('/nodes', serverRequest.bind(this, context.server));

    return <Field label="Node" htmlFor="serverNode">
        <select id="serverNode" className={styles.input}>
            <option value="">All</option>
            <option value="local">local</option>
            {nodes?.map(x => <option value={x.id}>{x.name}</option>)}
        </select>
    </Field>
}