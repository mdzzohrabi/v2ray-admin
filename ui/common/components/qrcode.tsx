export function QRCode({ data, className = '' }) {
    return <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(data)} className={className} alt="QR Code" /> ;
}