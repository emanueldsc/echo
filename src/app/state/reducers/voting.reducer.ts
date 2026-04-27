import { createFeature, createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Voting } from '../models/voting.model';
import { VotingActions } from '../actions/voting.actions';

export const votingsFeatureKey = 'votings';

export interface State extends EntityState<Voting> {
  // additional entities state properties
}

export const adapter: EntityAdapter<Voting> = createEntityAdapter<Voting>();

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(VotingActions.addVoting, (state, action) => adapter.addOne(action.voting, state)),
  on(VotingActions.upsertVoting, (state, action) => adapter.upsertOne(action.voting, state)),
  on(VotingActions.addVotings, (state, action) => adapter.addMany(action.votings, state)),
  on(VotingActions.upsertVotings, (state, action) => adapter.upsertMany(action.votings, state)),
  on(VotingActions.updateVoting, (state, action) => adapter.updateOne(action.voting, state)),
  on(VotingActions.updateVotings, (state, action) => adapter.updateMany(action.votings, state)),
  on(VotingActions.deleteVoting, (state, action) => adapter.removeOne(action.id, state)),
  on(VotingActions.deleteVotings, (state, action) => adapter.removeMany(action.ids, state)),
  on(VotingActions.loadVotings, (state, action) => adapter.setAll(action.votings, state)),
  on(VotingActions.clearVotings, (state) => adapter.removeAll(state)),
);

export const votingsFeature = createFeature({
  name: votingsFeatureKey,
  reducer,
  extraSelectors: ({ selectVotingsState }) => ({
    ...adapter.getSelectors(selectVotingsState),
  }),
});

export const { selectIds, selectEntities, selectAll, selectTotal } = votingsFeature;
