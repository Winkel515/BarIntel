update public.workouts
set exercises = coalesce(
	(
		select jsonb_agg(
			case
				when jsonb_typeof(exercise_item.exercise -> 'sets') = 'array' then
					jsonb_set(
						exercise_item.exercise,
						'{sets}',
						coalesce(
							(
								select jsonb_agg(set_item.set_data - 'rpe' order by set_item.set_order)
								from jsonb_array_elements(exercise_item.exercise -> 'sets')
									with ordinality as set_item(set_data, set_order)
							),
							'[]'::jsonb
						),
						false
					)
				else exercise_item.exercise
			end
			order by exercise_item.exercise_order
		)
		from jsonb_array_elements(public.workouts.exercises)
			with ordinality as exercise_item(exercise, exercise_order)
	),
	'[]'::jsonb
)
where jsonb_path_exists(exercises, '$[*].sets[*].rpe');
