import { CalendarIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { Field, FieldsGroup } from "../components/fields";
import { Info, Infos } from "../components/info";
import { Table } from "../components/table";
import { useContextSWR, usePrompt, useStoredState, useUser } from "../lib/hooks";
import { styles } from "../lib/styles";
import { queryString } from "../lib/util";

export default function UsagesPage() {

    let router = useRouter();
    let {access} = useUser();
    let email = router.query.user;
    let [view, setView] = useStoredState('usages-view', {
        showDetail: access('isAdmin') ? true : false
    });

    let {data: usages, mutate: refreshUsages, isValidating: isLoading} = useContextSWR<any[]>('/daily_usages' + queryString({ email }));
    const prompt = usePrompt();

    return <Container>
        <Head>
            <title>Daily Usages</title>
        </Head>
        <FieldsGroup title={<div className="flex flex-row gap-x-2 items-center">
            <CalendarIcon className="w-6"/>
            <span>Daily Usages</span>
        </div>} data={view} dataSetter={setView} horizontal>
            <Field label="User" className="border-x-[1px] px-4 m-2">
                <span className="text-gray-800 py-1 px-2 rounded-lg border-[1px]">{email}</span>
            </Field>
            {access('isAdmin')?<Field label="Show Detail" htmlFor="showDetail">
                <input type="checkbox" id="showDetail" />
            </Field>:null}
        </FieldsGroup>
        <Table
            rows={usages ?? []}
            loading={isLoading}
            groupBy={x => new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric'}).format(new Date(x.date))}
            group={(monthName: string) => <tr className="sticky top-[31px] z-50 bg-white shadow-sm">
                <td colSpan={5} className={'px-10 py-2 text-base font-bold'}>{monthName}</td>
            </tr>}
            columns={[ 'Date', 'First connect', 'Last connect', 'Requests' ]}
            cells={x => [
                // Date
                <DateView options={{ dateStyle: 'full' }} date={x.date} full={true} containerClassName="text-center"/>,
                // First connect
                (view.showDetail ? 
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>{new Date(o.firstConnect).toLocaleTimeString()}</Info>
                    })}
                </Infos> : x.outbounds.filter((o, i) => i == 0).map(o => new Date(o.firstConnect).toLocaleTimeString()).pop()) ?? '-',
                // Last connect
                (view.showDetail ?
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>{new Date(o.lastConnect).toLocaleTimeString()}</Info>
                    })}
                </Infos>
                : x.outbounds.filter((o, i) => i == 0).map(o => new Date(o.lastConnect).toLocaleTimeString()).pop()) ?? '-',
                // Requests
                view.showDetail ?
                <Infos>
                    {x.outbounds.map(o => {
                        return <Info label={o.tag}>
                            {o.counter} requests 
                            {access('isAdmin') ? 
                                <a className={classNames(styles.link, 'pl-2')} href={`/usages/logs?user=${email}&tag=${o.tag}&from=${o.firstConnectLogOffset}&to=${o.lastConnectLogOffset}`}> (Logs)</a> : null}
                        </Info>
                    })}
                </Infos>
                : x.outbounds.filter(o => o.tag == "direct").map(o => `${o.counter} requests`).pop()
            ]}
        />
    </Container>
    
}