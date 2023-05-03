import classNames from 'classnames';
import moment from 'jalali-moment';
import { useRouter } from 'next/router';
import { dateDiff } from '../lib/util';
import { Popup } from './popup';

interface DateViewProps {
    date: any,
    className?: string,
    containerClassName?: string
    full?: boolean
    precision?: boolean
    locale?: string
    options?: Intl.DateTimeFormatOptions
    removeFullMonths?: boolean
    popup?: boolean | string
}

export function DateView({ date, className = '', containerClassName ='', full = false, precision = false, locale = '', options = undefined, removeFullMonths = false, popup = true }: DateViewProps) {
    let router = useRouter();
    let isEN = (locale ?? router.query.date) == 'en';
    if (!date) return <>-</>;
    if (typeof date == 'string') date = date.replace(' ', ' ');
    date = date instanceof Date ? date : new Date(date);

    if (removeFullMonths) {
        let diff = new Date().getTime() - date.getTime();
        let remain = diff % (30*24*60*60*1000);
        date = new Date(date.getTime() + (diff - remain));
    }

    let intl = new Intl.DateTimeFormat(isEN ? 'en-US' : 'fa-IR-u-nu-latn', options ?? {
		timeStyle: 'medium',
		dateStyle: 'full'
	})

    let fromNow = precision ? dateDiff(date).text : moment(date).locale('fa').fromNow();
    let strDate = intl.format(date);// isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a');

    if (full) {
        return <Popup className={containerClassName} popup={!popup ? null : <span dir='rtl'>{fromNow}</span>}>
            <span className={classNames('block text-gray-900 text-rtl', className)}>{strDate}</span>
        </Popup>
    }

    return <Popup popup={!popup ? null : strDate} className={containerClassName}>
        <span className={classNames('block text-gray-500 text-rtl', className)}>{fromNow}</span>
    </Popup>;
}