import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useRotationMutations() {
  const queryClient = useQueryClient();

  const createRotationMutation = useMutation({
    mutationFn: (rotationData) => base44.entities.Rotation.create(rotationData),
    onMutate: async (newRotation) => {
      await queryClient.cancelQueries({ queryKey: ['rotations'] });
      const previousRotations = queryClient.getQueryData(['rotations']);

      queryClient.setQueryData(['rotations'], (old) => [
        { ...newRotation, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
        ...(old || []),
      ]);

      return { previousRotations };
    },
    onError: (err, newRotation, context) => {
      if (context?.previousRotations) {
        queryClient.setQueryData(['rotations'], context.previousRotations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    },
  });

  const updateRotationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rotation.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['rotations'] });
      const previousRotations = queryClient.getQueryData(['rotations']);

      queryClient.setQueryData(['rotations'], (old) =>
        old?.map((r) => (r.id === id ? { ...r, ...data } : r)) || []
      );

      return { previousRotations };
    },
    onError: (err, variables, context) => {
      if (context?.previousRotations) {
        queryClient.setQueryData(['rotations'], context.previousRotations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    },
  });

  const deleteRotationMutation = useMutation({
    mutationFn: (id) => base44.entities.Rotation.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['rotations'] });
      const previousRotations = queryClient.getQueryData(['rotations']);

      queryClient.setQueryData(['rotations'], (old) =>
        old?.filter((r) => r.id !== id) || []
      );

      return { previousRotations };
    },
    onError: (err, id, context) => {
      if (context?.previousRotations) {
        queryClient.setQueryData(['rotations'], context.previousRotations);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
    },
  });

  return {
    createRotationMutation,
    updateRotationMutation,
    deleteRotationMutation,
  };
}