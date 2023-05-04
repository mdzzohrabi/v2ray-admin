import { useContextSWR } from "../lib/hooks";
import { styles } from "@common/lib/styles";
import { Field, FieldProps } from "@common/components/fields";
import { Select } from "@common/components/select";

export function FieldServerNodes({ ...props }: FieldProps) {
    let {data: nodes} = useContextSWR<ServerNode[]>('/nodes');

    return <Field label="Node" htmlFor="serverNode" {...props}>
        <Select id={props.htmlFor ?? "serverNode"} className={styles.input} items={[
            { id: 'local', name: 'Local' },
            ...(nodes ?? [])
        ]} valueMember='id' displayMember='name' allowNull={true} nullText='All Server Nodes'>
        </Select>
    </Field>
}