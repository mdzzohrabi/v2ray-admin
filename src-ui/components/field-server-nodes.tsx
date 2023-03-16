import { useContextSWR } from "../lib/hooks";
import { styles } from "../lib/styles";
import { Field } from "./fields";

export function FieldServerNodes() {
    let {data: nodes} = useContextSWR<ServerNode[]>('/nodes');

    return <Field label="Node" htmlFor="serverNode">
        <select id="serverNode" className={styles.input}>
            <option value="">All</option>
            <option value="local">local</option>
            {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
    </Field>
}