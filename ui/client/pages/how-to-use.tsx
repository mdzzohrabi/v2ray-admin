import { styles } from "@common/lib/styles";
import { ArrowLeftOnRectangleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import { useRouter } from "next/router";
import { __ } from "../locale";

const className = {
    itemDownload: 'pointer hover:shadow-md px-3 py-3 rounded-lg border-[1px] hover:text-blue-700 hover:border-blue-500 duration-150 flex gap-x-2',
    card: "bg-white px-6 py-3 rounded-md self-center min-w-[90%] lg:min-w-[50%] w-full sm:w-auto sm:px-3 shadow-md",
    cardTitle: "flex gap-x-2 font-semibold pb-3 mb-3 border-b-[1px] border-b-gray-200"
}


export default function HowToUsePage() {

    const router = useRouter();

    return <div className="text-sm" style={{ direction: __('direction') }}>
        <Head>
            <title>{__('How to use')}</title>
        </Head>
        <div className="grid grid-cols-1 py-4 px-0 gap-5 sm:px-[5%] md:px-[10%] 2xl:px-[25%]">
                <div className={className.card}>
                    <h1 className={className.cardTitle}>
                        <div className="flex flex-1 items-center gap-x-2">
                            <QuestionMarkCircleIcon className="w-7"/>
                            {__('How to use')}
                        </div>
                        <div className="flex flex-row text-xs">
                            <button className={styles.buttonItem} onClick={() => router.back()}>
                                <ArrowLeftOnRectangleIcon className="w-4"/>
                                {__('Go Back')}
                            </button>
                        </div>
                    </h1>
                    <div>
                        <ul className="list-disc mr-8">
                            <li>
                                <span>
                                ابتدا "لینک اشتراک - SubScription" را از پنل خود کپی کنید
                                </span>
                                <img className="self-center my-4" src="/subscription-url-2.png"/>
                            </li>
                            <li>
                                <span>اگر از اندروید استفاده میکنید در برنامه V2RayNG در بخش Subscription Group Setting لینک را اضافه کنید</span>
                                <img className="self-center my-4" src="/subscription-v2ray-1.png"/>
                                <img className="self-center my-4" src="/subscription-v2ray-2.png"/>
                                <img className="self-center my-4" src="/subscription-v2ray-3.png"/>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
    </div>
}