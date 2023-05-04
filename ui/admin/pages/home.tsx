import { Container } from "../components/container";
import { DateView } from "@common/components/date-view";
import { Info, Infos } from "@common/components/info";
import { Loading } from "@common/components/loading";
import { Price } from "@common/components/price";
import { Progress, ProgressColors } from "@common/components/progress";
import { Size } from "@common/components/size";
import { useStoredState } from "@common/lib/hooks";
import { styles } from '@common/lib/styles';
import { queryString } from "@common/lib/util";
import { ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContextSWR, useUser } from "../lib/hooks";

export default function HomePage() {

    let router = useRouter();
    let showAll = router.query.all == '1';
    let { access } = useUser();

    let {data, isValidating: isLoading, mutate: refreshData} = useContextSWR('/summary' + queryString({ showAll }));
    let colors = ProgressColors;

    let [view, setView] = useStoredState('home-view', {
        serversDetail: true
    });

    return <Container block={false}>
        <Head>
            <title>Home</title>
        </Head>
        <Loading isLoading={isLoading}/>
        <div className="py-4 px-4 flex flex-row items-center">
            <h1 className="flex-1 text-xl flex flex-row items-center gap-x-2">
                <HomeIcon className="w-6"/>
                Dashboard
            </h1>
            <button onClick={e => refreshData()} className={styles.button}>
                <ArrowPathIcon className="w-4"/>
                Reload
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 px-3 gap-3">
            {access('home','users') || access('home', 'traffics') ?
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                    {access('home', 'users')?
                    <div className="bg-white shadow-md rounded-md px-4 py-3">
                        <h1 className="text-lg mb-2 pb-2 border-b-2">Users</h1>
                        <div className="pb-4 pt-2 px-0">
                            <Progress
                                title={`Connected Clients (${data?.users?.Active} active users)`}
                                total={data?.users?.Active}
                                bars={[
                                    {
                                        title: 'Connected',
                                        value: data?.users?.Connected_1_Hour,
                                        className: 'bg-lime-500'
                                    },
                                    {
                                        title: 'Disconnected',
                                        value: data?.users?.Active - data?.users?.Connected_1_Hour,
                                        className: 'bg-rose-500'
                                    }
                                ]}
                            />
                        </div>
                        <Infos className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
                            <Info className={'py-2'} label={"Total Users"}>{data?.users?.Total}</Info>
                            <Info className={'py-2'} label={"Active Users"}>{data?.users?.Active}</Info>
                            <Info className={'py-2'} label={"Free Users"}>{data?.users?.Free}</Info>
                            <Info className={'py-2'} label={"Paid Users"}>{data?.users?.Non_Free}</Info>
                            <Info className={'py-2'} label={"De-Active Users"}>{data?.users?.De_Active}</Info>
                            <Info className={'py-2'} label={"Expired Users"}>{data?.users?.Expired}</Info>
                            <Info className={'py-2'} label={"Connected Users (1 hour)"}>{data?.users?.Connected_1_Hour}</Info>
                            <Info className={'py-2'} label={"Connected Users (1 day)"}>{data?.users?.Connected_1_Day}</Info>
                            <Info className={'py-2'} label={"Disconnected Users (1 day)"}>{data?.users?.Not_Connected_1_Day}</Info>
                        </Infos>
                    </div>
                    :null}
                    {access('home', 'traffics')?
                    <div className="bg-white shadow-md rounded-md py-3 px-4">
                    <h1 className="text-lg mb-2 pb-2 border-b-2">Traffic (Month)</h1>
                    <div className="py-4 px-0">
                        <Progress
                            title="Traffic Summary"
                            bars={[
                                {
                                    value: data?.traffics?.totalSendMonth,
                                    title: 'Send',
                                    className: 'bg-yellow-500'
                                },
                                {
                                    value: data?.traffics?.totalReceiveMonth,
                                    title: 'Receive',
                                    className: 'bg-blue-500'
                                }
                            ]}
                            renderValue={x => <Size size={x}/>}
                            total={data?.traffics?.totalMonth}
                        />
                    </div>
                    <Infos>
                        <Info className={'py-2'} label={"Total"}>
                            <Size size={data?.traffics?.totalMonth}/>
                        </Info>
                        <Info className={'py-2'} label={"Send"}>
                            <Size size={data?.traffics?.totalSendMonth}/>
                        </Info>
                        <Info className={'py-2'} label={"Receive"}>
                            <Size size={data?.traffics?.totalReceiveMonth}/>
                        </Info>
                    </Infos>
                    <h3 className="text-mg py-2 my-2 border-t-[1px] border-b-[1px] font-bold">Top Usage Users</h3>
                    <Infos className="grid grid-cols-2 gap-x-4">
                        {data?.traffics?.top10usageUsers?.map((x, index) => {
                            return <Info key={index} className={'py-2'} label={x.user}>
                                <Size size={x.traffic}/>
                            </Info>
                        })}
                    </Infos>
                    </div> : null}
                </div>
            </div> : null }
            <div className="col-span-1 xl:col-span-2">
                <div className={classNames("grid grid-cols-1  gap-3", { 'xl:grid-cols-2': !!view.serversDetail })}>
                    {access('home', 'servers') ?
                    <div>
                        <div className="bg-white shadow-md rounded-md py-3 px-4">
                            <h1 className="text-lg mb-2 pb-2 border-b-2">Servers</h1>
                            <div className="py-4 px-0 gap-y-4 flex flex-col">
                                <Progress
                                    title={`Connected Clients (${data?.users?.Connected_1_Hour} users)`}
                                    noBarsMessage={'No users connected'}
                                    bars={data?.nodes?.map(node => {
                                        return {
                                            value: node.connectedClients,
                                            title: node.name
                                        }
                                    })}
                                    total={data?.users?.Connected_1_Hour}
                                />
                                <Progress
                                    title={<>Traffic Usage (<Size size={data?.traffics?.totalMonth}/>)</>}
                                    noBarsMessage={'No users connected'}
                                    bars={data?.nodes?.map(node => {
                                        return {
                                            value: node.monthlyTrafficUsage,
                                            title: node.name
                                        }
                                    })}
                                    total={data?.traffics?.totalMonth}
                                    renderValue={x => <Size size={x}/>}
                                />
                            </div>
                            {view.serversDetail ? 
                            <><Infos className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-x-4">
                                {data?.nodes?.map((node, index) => {
                                    return <Info key={index} label={<div className="flex">
                                        <span className={classNames(colors[index] ,'aspect-square w-4 h-4 rounded-full mr-3')}></span>
                                        {node.name}
                                    </div>} className='py-2'>
                                        <Infos className="flex-1">
                                            <Info label={'Connected users (1 hour)'}>{node.connectedClients}</Info>
                                            <Info label={'Monthly Traffic Usage'}>
                                                <Size size={node.monthlyTrafficUsage}/>
                                            </Info>
                                            <Info label={'Last sync date'}>
                                                <DateView date={node.lastConnectDate}/>
                                            </Info>
                                        </Infos>
                                    </Info>
                                })}
                            </Infos>
                            <span className={styles.link} onClick={() => setView({ ...view, serversDetail: false })}>Hide Details ...</span>
                            </> : <span className={styles.link} onClick={() => setView({ ...view, serversDetail: true })}>Show Details ...</span> }
                        </div>
                    </div>
                    :null}
                    {access('home', 'transactions')?
                    <div>
                        <div className="bg-white shadow-md rounded-md py-3 px-4">
                            <h1 className="text-lg mb-2 pb-2 border-b-2">Transactions (Month)</h1>
                            <div className="py-4 px-0">
                                <Progress
                                    total={data?.transactions?.totalBillMonth}
                                    bars={[
                                        {
                                            title: 'Renew',
                                            value: data?.transactions?.totalRenewMonth
                                        },
                                        {
                                            title: 'Create',
                                            value: data?.transactions?.totalCreateMonth
                                        },
                                        {
                                            title: 'Cost',
                                            value: data?.transactions?.totalCostMonth
                                        }
                                    ]}
                                    title={'Month Overview'}
                                    renderValue={x => <Price value={x}/>}
                                />
                            </div>
                            <Infos>
                                <Info className={'py-2'} label={"Un-Paid from Last Months"}>
                                    <Price value={data?.transactions?.unPaidFromPast}/>
                                </Info>
                                <Info className={'py-2'} label={"Un-Paid this Month"}>
                                    <Price value={data?.transactions?.totalRemainMonth}/>
                                </Info>
                                <Info className={'py-2 font-bold'} label={"Remain"}>
                                    <Price value={data?.transactions?.totalRemainMonth + data?.transactions?.unPaidFromPast}/>
                                </Info>
                                <Info className={'py-2'} label={"Bill"}>
                                    <Price value={data?.transactions?.totalBillMonth}/>
                                </Info>
                                <Info className={'py-2'} label={"Sell"}>
                                    <Price value={data?.transactions?.totalSellMonth}/>
                                </Info>
                                <Info className={'py-2'} label={"Cost"}>
                                    <Price value={data?.transactions?.totalCostMonth}/>
                                </Info>
                                <Info className={'py-2'} label={"Renew"}>
                                    <Price value={data?.transactions?.totalRenewMonth}/>
                                </Info>
                                <Info className={'py-2'} label={"Create"}>
                                    <Price value={data?.transactions?.totalCreateMonth}/>
                                </Info>
                                <Info className={'py-2'} label={"Paid"}>
                                    <Price value={data?.transactions?.totalPaidMonth}/>
                                </Info>
                            </Infos>
                        </div>
                    </div>: null}
                </div>
            </div>
        </div>
    </Container>
}