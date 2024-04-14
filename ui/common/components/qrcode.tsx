import QRCodeBase from 'react-qr-code';
export function QRCode({ data, className = '' }) {
    return <QRCodeBase value={data} className={className}/>;
    // return <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(data)} className={className} alt="QR Code" /> ;
}