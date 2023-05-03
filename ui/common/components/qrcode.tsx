export function QRCode({ data }) {
    return <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=` + encodeURIComponent(data)} alt="QR Code" /> ;
}