import { DateView } from "@common/components/date-view"
import { Dialog } from "@common/components/dialog"
import { Field, FieldsGroup } from "@common/components/fields"
import { Infos, Info } from "@common/components/info"
import { Price } from "@common/components/price"
import { Table } from "@common/components/table"
import { toast } from "@common/lib/hooks"
import UserMinusIcon from "@heroicons/react/24/outline/UserMinusIcon"
import { useCallback, useEffect, useState } from "react"
import { Transaction, V2RayConfigInboundClient } from "../../../../types"
import { useContextSWR, useRequest } from "../../lib/hooks"
import { styles } from "../../lib/styles"

export interface ClientCancelDialogProps {
    onClose?: Function
    onDone?: Function
    user?: V2RayConfigInboundClient
}

export function ClientCancelDialog({user, onClose, onDone}: ClientCancelDialogProps) {

    const {data: transactions, isValidating: isLoading} = useContextSWR<Transaction[]>('/transactions?user=' + user.email);
    const [data, setData] = useState({
        deActiveReason: user?.deActiveReason,
        transactionRemark: ''
    })

    useEffect(() => transactions?.length > 0 ? setData({ ...data, transactionRemark: transactions[transactions.length-1].remark }) : null, [transactions]);

    const request = useRequest();

    const cancelUser = useCallback(() => {
        let task = request('/user/cancel', {
            user: user?.email,
            ...data
        });
        toast.promise(task, {
            success: 'User canceled',
            error: err => `Error: ${err?.message ?? 'Unknown'}`,
            loading: 'Please wait ...'
        });
        task.then(() => onClose?.call(this));
    }, [request, data, user]);

    return <Dialog onClose={onClose} title={'Cancel user - ' + user.email}>
        <FieldsGroup data={data} dataSetter={setData}>
        <Infos>
            <Info label={'Username'} className={'py-2'}>{user.email}</Info>
            <Info label={'Billing'} className={'py-2'}>
                <DateView full={true} date={user['billingStartDate']}/>
            </Info>
            <Info label={'De-active remark'} className={'py-2'}>
                <Field htmlFor="deActiveReason" className="flex-1">
                    <input type="text" id="deActiveReason" className={styles.input} placeholder={'Canceled - Expired'}/>
                </Field>
            </Info>
            <Info label={'De-active remark'} className={'py-2'}>
                <Field htmlFor="transactionRemark" className="flex-1">
                    <input type="text" id="transactionRemark" className={styles.input} placeholder={'Cancel'}/>
                </Field>
            </Info>
        </Infos>
        <div className="flex justify-end py-2">
            <button className={styles.buttonItem} type="button" onClick={() => cancelUser()}>
                <UserMinusIcon className="w-4"/>
                Cancel User
            </button>
        </div>
        </FieldsGroup>
        <Table
            rows={transactions ?? []}
            loading={isLoading}
            columns={['Date', 'Amount', 'Remark']}
            cells={x => [
                <DateView full={true} date={x.createDate}/>,
                <Price value={x.amount ?? '0'}/>,
                x.remark
            ]}
        />
    </Dialog>

}