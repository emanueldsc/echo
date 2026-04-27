import { createFeature, createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { RoundHistory } from '../models/round-history.model';
import { RoundHistoryActions } from '../actions/round-history.actions';

export const roundHistoriesFeatureKey = 'roundHistories';

export interface State extends EntityState<RoundHistory> {
  // additional entities state properties
}

export const adapter: EntityAdapter<RoundHistory> = createEntityAdapter<RoundHistory>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(RoundHistoryActions.addRoundHistory, (state, action) =>
    adapter.addOne(action.roundHistory, state),
  ),
  on(RoundHistoryActions.upsertRoundHistory, (state, action) =>
    adapter.upsertOne(action.roundHistory, state),
  ),
  on(RoundHistoryActions.addRoundHistorys, (state, action) =>
    adapter.addMany(action.roundHistorys, state),
  ),
  on(RoundHistoryActions.upsertRoundHistorys, (state, action) =>
    adapter.upsertMany(action.roundHistorys, state),
  ),
  on(RoundHistoryActions.updateRoundHistory, (state, action) =>
    adapter.updateOne(action.roundHistory, state),
  ),
  on(RoundHistoryActions.updateRoundHistorys, (state, action) =>
    adapter.updateMany(action.roundHistorys, state),
  ),
  on(RoundHistoryActions.deleteRoundHistory, (state, action) =>
    adapter.removeOne(action.id, state),
  ),
  on(RoundHistoryActions.deleteRoundHistorys, (state, action) =>
    adapter.removeMany(action.ids, state),
  ),
  on(RoundHistoryActions.loadRoundHistorys, (state, action) =>
    adapter.setAll(action.roundHistorys, state),
  ),
  on(RoundHistoryActions.clearRoundHistorys, (state) => adapter.removeAll(state)),
);

export const roundHistoriesFeature = createFeature({
  name: roundHistoriesFeatureKey,
  reducer,
  extraSelectors: ({ selectRoundHistoriesState }) => ({
    ...adapter.getSelectors(selectRoundHistoriesState),
  }),
});

export const { selectIds, selectEntities, selectAll, selectTotal } = roundHistoriesFeature;
