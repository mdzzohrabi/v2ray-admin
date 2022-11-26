// @ts-check
import classNames from 'classnames';
import moment from 'jalali-moment';
import { useRouter } from 'next/router';
import React from 'react';
import { dateDiff } from '../lib/util';
import { Popup } from './popup';

/**
 * Date view
 */
export function DateView({ date, className = '', containerClassName ='', full = false, precision = false }) {
    let router = useRouter();
    let isEN = router.query.date == 'en';
    if (!date) return <>-</>;
    date = date instanceof Date ? date : new Date(date);
    // return <>
    //     {isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a')}
    //     <span className='block text-gray-500 text-rtl'>{moment(date).locale('fa').fromNow()}</span>
    // </>;

    let fromNow = precision ? dateDiff(date).text : moment(date).locale('fa').fromNow();
    let strDate = isEN ? date.toLocaleString() : moment(date).locale('fa').format('YYYY/MM/DD hh:mm:ss a');

    if (full) {
        return <Popup className={containerClassName} popup={<span dir='rtl'>{fromNow}</span>}>
            <span className={classNames('block text-gray-900 text-rtl', className)}>{strDate}</span>
        </Popup>
    }

    return <Popup popup={strDate} className={containerClassName}>
        <span className={classNames('block text-gray-500 text-rtl', className)}>{fromNow}</span>
    </Popup>;


}