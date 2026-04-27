import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';

import { RoundHistory } from '../models/round-history.model';

export const RoundHistoryActions = createActionGroup({
  source: 'RoundHistory/API',
  events: {
    'Load RoundHistorys': props<{ roundHistorys: RoundHistory[] }>(),
    'Add RoundHistory': props<{ roundHistory: RoundHistory }>(),
    'Upsert RoundHistory': props<{ roundHistory: RoundHistory }>(),
    'Add RoundHistorys': props<{ roundHistorys: RoundHistory[] }>(),
    'Upsert RoundHistorys': props<{ roundHistorys: RoundHistory[] }>(),
    'Update RoundHistory': props<{ roundHistory: Update<RoundHistory> }>(),
    'Update RoundHistorys': props<{ roundHistorys: Update<RoundHistory>[] }>(),
    'Delete RoundHistory': props<{ id: string }>(),
    'Delete RoundHistorys': props<{ ids: string[] }>(),
    'Clear RoundHistorys': emptyProps(),
  },
});
