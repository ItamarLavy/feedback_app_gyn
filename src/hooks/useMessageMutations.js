import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useMessageMutations() {
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const previousMessages = queryClient.getQueryData(['messages']);

      queryClient.setQueryData(['messages'], (old) => [
        ...(old || []),
        { ...newMessage, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
      ]);

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages'], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const markMessageAsReadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Message.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const previousMessages = queryClient.getQueryData(['messages']);

      queryClient.setQueryData(['messages'], (old) =>
        old?.map((m) => (m.id === id ? { ...m, ...data } : m)) || []
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages'], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return {
    sendMessageMutation,
    markMessageAsReadMutation,
  };
}