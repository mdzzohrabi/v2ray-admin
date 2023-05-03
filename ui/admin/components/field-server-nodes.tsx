import { useContextSWR } from "../lib/hooks";
import { styles } from "@common/lib/styles";
import { Field, FieldProps } from "@common/components/fields";

export function FieldServerNodes({ ...props }: FieldProps) {
    let {data: nodes} = useContextSWR<ServerNode[]>('/nodes');

    return <Field label="Node" htmlFor="serverNode" {...props}>
        <select id={props.htmlFor ?? "serverNode"} className={styles.input}>
            <option value="">All</option>
            <option value="local">local</option>
            {nodes?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
    </Field>
}