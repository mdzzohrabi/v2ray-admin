// @ts-check
import classNames from "classnames";
import Head from "next/head";
import React from "react";
import { Container } from "../components/container";
import { DateView } from "../components/date-view";
import { Info, Infos } from "../components/info";
import { Loading } from "../components/loading";
import { Price } from "../components/price";
import { Size } from "../components/size";
import { useContextSWR, useStoredState } from "../lib/hooks";
import { styles } from '../lib/styles';

export default function HomePage() {

    let {data, isValidating: isLoading, mutate: refreshData} = useContextSWR('/summary');
    let colors = ['bg-yellow-500', 'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-lime-500', 'bg-teal-500',  'bg-sky-500', 'bg-black'];

    let [view, setView] = useStoredState('home-view', {
        serversDetail: false
    });

    return <Container block={false}>
        <Head>
            <title>Home</title>
        </Head>
        <Loading isLoading={isLoading}/>
        <div className="pb-2 px-4 flex flex-1 items-center">
            <h1 className="flex-1 text-xl">Dashboard</h1>
            <button onClick={e => refreshData()} className={styles.button}>Reload</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 px-3 gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="bg-white shadow-md rounded-md px-4 py-3">
                    <h1 className="text-lg mb-2 pb-2 border-b-2">Users</h1>
                    <div className="pb-4 pt-2 px-0">
                        <span className="pb-2 text-gray-500 block">Connected Clients ({data?.users?.Active} active users)</span>
                        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
                            {!data?.users?.Active ? <div className="flex-1 flex items-center justify-center">No Active Users</div> : <>
                                <span className={"bg-emerald-700 overflow-hidden items-center justify-center flex text-white text-[.6rem]"} style={{ width: `${data?.users?.Connected_1_Hour * 100 / data?.users?.Active}%` }} title={'Connected'}>
                                    {data?.users?.Connected_1_Hour}
                                </span>
                                <span className={"bg-pink-700 overflow-hidden items-center justify-center flex text-white text-[.6rem]"} style={{ width: `${100 - (data?.users?.Connected_1_Hour * 100 / data?.users?.Active)}%` }} title={'Disconnected'}>
                                    {data?.users?.Active - data?.users?.Connected_1_Hour}
                                </span>
                            </>}
                        </div>
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
                <div className="bg-white shadow-md rounded-md py-3 px-4">
                <h1 className="text-lg mb-2 pb-2 border-b-2">Traffic (Month)</h1>
                <div className="py-4 px-0">
                    <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
                        <span className="bg-yellow-500 items-center justify-center flex text-white text-[.6rem]" style={{ width: `${data?.traffics?.totalSendMonth * 100 / data?.traffics?.totalMonth}%` }}>
                            Send
                        </span>
                        <span className="bg-blue-500 items-center justify-center flex text-white text-[.6rem]" style={{ width: `${data?.traffics?.totalReceiveMonth * 100 / data?.traffics?.totalMonth}%` }}>
                            Receive
                        </span>
                    </div>
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
            </div>
            </div>
            <div className={classNames("grid grid-cols-1 col-span-1 xl:col-span-2 gap-3", { 'xl:grid-cols-2': view.serversDetail })}>
                <div className="bg-white shadow-md rounded-md py-3 px-4">
                    <h1 className="text-lg mb-2 pb-2 border-b-2">Servers</h1>
                    <div className="py-4 px-0">
                        <span className="pb-2 text-gray-500 block">Connected Clients ({data?.users?.Connected_1_Hour} users)</span>
                        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
                            {data?.users?.Connected_1_Hour == 0 ? <div className="flex-1 flex items-center justify-center">No Users connected</div> : data?.nodes?.map((node, index) => {
                                if (node.connectedClients <= 0) return null;
                                let percent = node.connectedClients * 100 / data?.users?.Connected_1_Hour;
                                return <span key={index} className={classNames(colors[index], "overflow-hidden items-center justify-center flex text-white text-[.6rem]")} style={{ width: `${percent}%` }} title={node.name + ' - ' + percent.toFixed(2) + '%'}>
                                    {node.connectedClients}
                                </span>
                            })}
                        </div>

                        <span className="py-2 text-gray-500 block">Traffic Usage (<Size size={data?.traffics?.totalMonth}/>)</span>
                        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
                            {!data?.traffics?.totalMonth ? <div className="flex-1 flex items-center justify-center">No Traffic Usage</div> : data?.nodes?.map((node, index) => {
                                if (node.monthlyTrafficUsage <= 0) return null;
                                let percent = node.monthlyTrafficUsage * 100 / data?.traffics?.totalMonth;
                                return <span key={index} className={classNames(colors[index], "items-center overflow-hidden justify-center flex text-white text-[.6rem]")} style={{ width: `${percent}%` }} title={node.name + ' - ' + percent.toFixed(2) + '%'}>
                                    <Size size={node.monthlyTrafficUsage}/>
                                </span>
                            })}
                        </div>

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
                <div className="bg-white shadow-md rounded-md py-3 px-4">
                    <h1 className="text-lg mb-2 pb-2 border-b-2">Transactions (Month)</h1>
                    <div className="py-4 px-0">
                        <div className="flex flex-row bg-gray-200 h-6 w-full relative rounded-xl overflow-hidden">
                            <span style={{ width: `${data?.transactions?.totalPaidMonth * 100 / data?.transactions?.totalBillMonth}%` }} className={`block absolute top-0 left-0 text-[0.6rem] border-r-2 border-r-black h-full border-dotted bg-opacity-10`}>
                                &nbsp;
                            </span>
                            <span className="bg-yellow-500 items-center justify-center flex text-white text-[.6rem]" style={{ width: `${data?.transactions?.totalRenewMonth * 100 / data?.transactions?.totalBillMonth}%` }}>
                                Renew
                            </span>
                            <span className="bg-blue-500 items-center justify-center flex text-white text-[.6rem]" style={{ width: `${data?.transactions?.totalCreateMonth * 100 / data?.transactions?.totalBillMonth}%` }}>
                                Create
                            </span>
                            <span className="bg-red-500 items-center justify-center flex text-white text-[.6rem]" style={{ width: `${data?.transactions?.totalCostMonth * 100 / data?.transactions?.totalBillMonth}%` }}>
                                Cost
                            </span>
                        </div>
                    </div>
                    <Infos>
                        <Info className={'py-2'} label={"Remain"}>
                            <Price value={data?.transactions?.totalRemainMonth}/>
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
            </div>
            
        </div>
    </Container>
}