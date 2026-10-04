import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { buildPhotoRoute } from '../utils/lighttraceRoute';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function LighttraceMap({ images, onSelect }) {
    const containerRef = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    useEffect(() => {
        if (!containerRef.current) return undefined;

        const map = L.map(containerRef.current, {
            center: [25, 110],
            zoom: 3,
            minZoom: 2,
            worldCopyJump: true,
            scrollWheelZoom: true
        });
        L.tileLayer(TILE_URL, {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const markers = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 50 });
        const { stops, legs } = buildPhotoRoute(images);
        const order = new Map(stops.map((stop, index) => [stop.id, index + 1]));
        const bounds = [];
        for (const leg of legs) {
            L.polyline(
                [[leg.from.latitude, leg.from.longitude], [leg.to.latitude, leg.to.longitude]],
                {
                    color: leg.inferredJump ? '#e4bd8d' : '#5cd5c4',
                    weight: leg.inferredJump ? 2 : 3,
                    opacity: leg.inferredJump ? 0.68 : 0.9,
                    dashArray: leg.inferredJump ? '6 8' : undefined,
                    interactive: false
                }
            ).addTo(map);
        }
        for (const image of images) {
            const latitude = Number(image.latitude);
            const longitude = Number(image.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'lighttrace-map-popup';
            button.setAttribute('aria-label', `查看照片：${image.title || '未命名光影'}`);
            const thumb = document.createElement('img');
            thumb.src = image.data;
            thumb.alt = '';
            const caption = document.createElement('span');
            caption.textContent = `${order.has(image.id) ? `第 ${order.get(image.id)} 站 · ` : ''}${image.title || '未命名光影'}`;
            button.append(thumb, caption);
            if (image.takenAt || image.date) {
                const time = document.createElement('small');
                time.textContent = (image.takenAt || image.date).slice(0, 16).replace('T', ' ');
                button.append(time);
            }
            button.addEventListener('click', () => onSelectRef.current(image));
            markers.addLayer(L.marker([latitude, longitude]).bindPopup(button, { minWidth: 160 }));
            bounds.push([latitude, longitude]);
        }
        map.addLayer(markers);
        if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
        const resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(containerRef.current);
        return () => {
            resize.disconnect();
            map.remove();
        };
    }, [images]);

    return <div ref={containerRef} className="lighttrace-map" role="region" aria-label="光影留痕照片地图" />;
}
