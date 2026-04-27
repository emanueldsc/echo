import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';

import { Voting } from '../models/voting.model';

export const VotingActions = createActionGroup({
  source: 'Voting/API',
  events: {
    'Load Votings': props<{ votings: Voting[] }>(),
    'Add Voting': props<{ voting: Voting }>(),
    'Upsert Voting': props<{ voting: Voting }>(),
    'Add Votings': props<{ votings: Voting[] }>(),
    'Upsert Votings': props<{ votings: Voting[] }>(),
    'Update Voting': props<{ voting: Update<Voting> }>(),
    'Update Votings': props<{ votings: Update<Voting>[] }>(),
    'Delete Voting': props<{ id: string }>(),
    'Delete Votings': props<{ ids: string[] }>(),
    'Clear Votings': emptyProps(),
  },
});
