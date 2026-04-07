import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnsApi } from '../api/columns';

export function useReorderColumns(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      columnsApi.reorder(boardId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}
