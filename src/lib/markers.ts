import { formatWhen } from './format';
import { PLACE_KINDS } from '../data/labels';
import type { EventItem, MapMarker, Place } from '../data/types';

export function placeMarkers(places: Place[]): MapMarker[] {
  return places.flatMap((p) =>
    p.location
      ? [
          {
            id: `place-${p.id}`,
            lng: p.location[0],
            lat: p.location[1],
            title: p.name,
            subtitle: `${PLACE_KINDS[p.kind].label} / ${p.category}`,
            href: `/places/${p.id}`,
            kind: p.kind,
          },
        ]
      : [],
  );
}

export function eventMarkers(events: EventItem[]): MapMarker[] {
  return events.flatMap((e) =>
    e.location
      ? [
          {
            id: `event-${e.id}`,
            lng: e.location[0],
            lat: e.location[1],
            title: e.title,
            subtitle: `${formatWhen(e.startsAt, e.endsAt, e.allDay)} / ${e.venueName}`,
            href: `/events/${e.id}`,
            kind: 'event',
          },
        ]
      : [],
  );
}
