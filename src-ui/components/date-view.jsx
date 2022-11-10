import classNames from 'classnames';
import moment from 'jalali-moment';
import { useRouter } from 'next/router';
import { Popup } from './popup';

/**
 * Date view
 * @param {{ date: Date | string | undefined | null, full?: boolean }} param0 
 * @returns 
 */
export function DateView({ date, className = '', full = false }) {
    let router = useRouter();
    let isEN = router.query.date == 'en';
    if (!date) return <>-</>;
    date = date instanceof Date ? date : new Date(date);
    // return <>
    //     {isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}
    //     <span className='block text-gray-500 text-rtl'>{moment(date).locale('fa').fromNow()}</span>
    // </>;

    if (full) {
        return <Popup popup={moment(date).locale('fa').fromNow()}>
            <span className={classNames('block text-gray-900 text-rtl', className)}>{isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}</span>
        </Popup>
    }

    return <Popup popup={isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}>
        <span className={classNames('block text-gray-500 text-rtl', className)}>{moment(date).locale('fa').co)}</span>
    </Popup>;


}