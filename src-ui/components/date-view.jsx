import moment from 'jalali-moment';
import { useRouter } from 'next/router';

/**
 * Date view
 * @param {{ date: Date | string | undefined | null }} param0 
 * @returns 
 */
export function DateView({ date }) {
    let router = useRouter();
    let isEN = router.query.date == 'en';
    if (!date) return <>-</>;
    date = date instanceof Date ? date : new Date(date);
    return <>
        {isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}
        <span className='block text-gray-500'>{moment(date).locale('fa').fromNow()}</span>
    </>;
}