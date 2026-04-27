import { createFeature, createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Session } from '../models/session.model';
import { SessionActions } from '../actions/session.actions';

export const sessionsFeatureKey = 'sessions';

export interface State extends EntityState<Session> {
  // additional entities state properties
}

export const adapter: EntityAdapter<Session> = createEntityAdapter<Session>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(SessionActions.addSession, (state, action) => adapter.addOne(action.session, state)),
  on(SessionActions.upsertSession, (state, action) => adapter.upsertOne(action.session, state)),
  on(SessionActions.addSessions, (state, action) => adapter.addMany(action.sessions, state)),
  on(SessionActions.upsertSessions, (state, action) => adapter.upsertMany(action.sessions, state)),
  on(SessionActions.updateSession, (state, action) => adapter.updateOne(action.session, state)),
  on(SessionActions.updateSessions, (state, action) => adapter.updateMany(action.sessions, state)),
  on(SessionActions.deleteSession, (state, action) => adapter.removeOne(action.id, state)),
  on(SessionActions.deleteSessions, (state, action) => adapter.removeMany(action.ids, state)),
  on(SessionActions.loadSessions, (state, action) => adapter.setAll(action.sessions, state)),
  on(SessionActions.clearSessions, (state) => adapter.removeAll(state)),
);

export const sessionsFeature = createFeature({
  name: sessionsFeatureKey,
  reducer,
  extraSelectors: ({ selectSessionsState }) => ({
    ...adapter.getSelectors(selectSessionsState),
  }),
});

export const { selectIds, selectEntities, selectAll, selectTotal } = sessionsFeature;
