import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useFeedbackMutations() {
  const queryClient = useQueryClient();

  const createFeedbackMutation = useMutation({
    mutationFn: (feedbackData) => base44.entities.Feedback.create(feedbackData),
    onMutate: async (newFeedback) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['feedbacks'] });

      // Snapshot previous data
      const previousFeedbacks = queryClient.getQueryData(['feedbacks']);

      // Optimistic update
      queryClient.setQueryData(['feedbacks'], (old) => [
        { ...newFeedback, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
        ...(old || []),
      ]);

      return { previousFeedbacks };
    },
    onError: (err, newFeedback, context) => {
      // Rollback on error
      if (context?.previousFeedbacks) {
        queryClient.setQueryData(['feedbacks'], context.previousFeedbacks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Feedback.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['feedbacks'] });
      const previousFeedbacks = queryClient.getQueryData(['feedbacks']);

      queryClient.setQueryData(['feedbacks'], (old) =>
        old?.map((f) => (f.id === id ? { ...f, ...data } : f)) || []
      );

      return { previousFeedbacks };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeedbacks) {
        queryClient.setQueryData(['feedbacks'], context.previousFeedbacks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: (id) => base44.entities.Feedback.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['feedbacks'] });
      const previousFeedbacks = queryClient.getQueryData(['feedbacks']);

      queryClient.setQueryData(['feedbacks'], (old) =>
        old?.filter((f) => f.id !== id) || []
      );

      return { previousFeedbacks };
    },
    onError: (err, id, context) => {
      if (context?.previousFeedbacks) {
        queryClient.setQueryData(['feedbacks'], context.previousFeedbacks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });

  return {
    createFeedbackMutation,
    updateFeedbackMutation,
    deleteFeedbackMutation,
  };
}