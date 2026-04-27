import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { RoomActions } from '../actions/room.actions';
import { Room } from '../models/room.model';

export const roomFeatureKey = 'room';

export interface State extends EntityState<Room> {
  // additional entities state properties
}

export const adapter: EntityAdapter<Room> = createEntityAdapter<Room>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(RoomActions.addRoom, (state, action) => adapter.addOne(action.room, state)),
  on(RoomActions.upsertRoom, (state, action) => adapter.upsertOne(action.room, state)),
  on(RoomActions.addRooms, (state, action) => adapter.addMany(action.rooms, state)),
  on(RoomActions.upsertRooms, (state, action) => adapter.upsertMany(action.rooms, state)),
  on(RoomActions.updateRoom, (state, action) => adapter.updateOne(action.room, state)),
  on(RoomActions.updateRooms, (state, action) => adapter.updateMany(action.rooms, state)),
  on(RoomActions.deleteRoom, (state, action) => adapter.removeOne(action.id, state)),
  on(RoomActions.deleteRooms, (state, action) => adapter.removeMany(action.ids, state)),
  on(RoomActions.loadRooms, (state, action) => adapter.setAll(action.rooms, state)),
  on(RoomActions.clearRooms, (state) => adapter.removeAll(state)),
);

export const roomFeature = createFeature({
  name: roomFeatureKey,
  reducer,
  extraSelectors: ({ selectRoomState }) => ({
    ...adapter.getSelectors(selectRoomState),
  }),
});

export const { selectIds, selectEntities, selectAll, selectTotal } = roomFeature;
