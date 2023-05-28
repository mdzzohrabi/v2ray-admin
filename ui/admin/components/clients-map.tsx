import { DateView } from '@common/components/date-view';
import { Info, Infos } from '@common/components/info';
import { Icon, Point } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { V2RayConfigInboundClient } from '../../../types';
import { useContextSWR } from '../lib/hooks';

export default function ClientsMap() {

    const { data, isLoading } = useContextSWR<(Pick<V2RayConfigInboundClient, 'email'|'lastConnectIP'|'lastConnectNode'|'lastConnect'> & { latlong?: [number, number], org?: string })[]>('/inbounds', {
        view: { limit: 1000, statusFilter: ['Active', 'Connected (1 Hour)'] },
        flat: true,
        fields: ['email', 'lastConnectIP', 'lastConnectNode', 'lastConnect']
    });

    const [clients, setClients] = useState(data ?? []);

    const wait = (ms: number) => new Promise(done => setTimeout(done, ms));
    const [abort, setAbort] = useState(new AbortController);

    // Fetch IP Informations
    useEffect(() => {
        console.log('[ClientMaps]', 'Data changed');
        abort?.abort();
        let _abort = new AbortController;
        setAbort(_abort);
        if (!data) return;
        new Promise(async done => {
            for (let client of data.filter(c => !!c.lastConnectIP)) {
                if (_abort.signal?.aborted) break;
                let cached = localStorage.getItem('ipapi-' + client.lastConnectIP);
                if (cached) {
                    let result = JSON.parse(cached);                   
                    if (_abort?.signal?.aborted) return;
                    let {latitude, longitude, org} = result;
                    client.latlong = [latitude, longitude];
                    client.org = org;
                    setClients([ ...data ]);
                    continue;
                }
                await wait(200);
                fetch(`https://ipapi.co/${client.lastConnectIP}/json/`)
                    .then(result => result.json())
                    .then(result => {
                        localStorage.setItem('ipapi-' + client.lastConnectIP, JSON.stringify(result));
                        if (_abort?.signal?.aborted) return;
                        let {latitude, longitude, org} = result;
                        client.latlong = [latitude, longitude];
                        client.org = org;
                        setClients([ ...data ]);
                    })
                    .catch(err => console.error(err));
            }
            done(true);
        });

        return () => abort?.abort();
    }, [data]);

    return <MapContainer center={[32.695, 53.921]} zoom={4} scrollWheelZoom={true} style={{ width: '100%', height: '300px' }}>
    <TileLayer
      attribution='Connected Clients'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    {clients.filter(client => Array.isArray(client.latlong) && typeof client.latlong[0] == 'number').map((client, index) => {
        return <Marker key={index} position={client.latlong} title={client.email} icon={new Icon({ iconUrl: '/map-user.png', iconSize: new Point(20, 20) })}>
            <Popup>
                <Infos>
                    <Info label={'Username'}>{client.email}</Info>
                    <Info label={'IP'}>{client.lastConnectIP}</Info>
                    <Info label={'Last Connect'}><DateView date={client.lastConnect} full={false}/></Info>
                    <Info label={'Organization'}>{client.org}</Info>
                </Infos>
            </Popup>
        </Marker>
    })}
  </MapContainer>;
    // return <MapContainer center={[32.695, 53.921]} zoom={6} scrollWheelZoom={true}>
    //     <TileLayer />
    // </MapContainer>
}