import { Update } from '@ngrx/entity';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Room } from '../models/room.model';

export const RoomActions = createActionGroup({
  source: 'Room/API',
  events: {
    'Load Rooms': props<{ rooms: Room[] }>(),
    'Add Room': props<{ room: Room }>(),
    'Upsert Room': props<{ room: Room }>(),
    'Add Rooms': props<{ rooms: Room[] }>(),
    'Upsert Rooms': props<{ rooms: Room[] }>(),
    'Update Room': props<{ room: Update<Room> }>(),
    'Update Rooms': props<{ rooms: Update<Room>[] }>(),
    'Delete Room': props<{ id: string }>(),
    'Delete Rooms': props<{ ids: string[] }>(),
    'Clear Rooms': emptyProps(),
  },
});
