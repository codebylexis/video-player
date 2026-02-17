import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const nextState = typeof newState === 'function' ? (newState as any)(currentState) : newState;
      
      // Simple equality check to avoid history entries for no-ops
      if (JSON.stringify(nextState) === JSON.stringify(currentState)) return currentState;
      
      setPast((prev) => [...prev, currentState]);
      setFuture([]); // Clear future on new change
      return nextState;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;
      const newPast = [...prev];
      const previousState = newPast.pop()!;
      
      setFuture((prevFuture) => [state, ...prevFuture]);
      setState(previousState);
      
      return newPast;
    });
  }, [state]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const newFuture = [...prev];
      const nextState = newFuture.shift()!;
      
      setPast((prevPast) => [...prevPast, state]);
      setState(nextState);
      
      return newFuture;
    });
  }, [state]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return { state, set, undo, redo, canUndo, canRedo, past, future };
}
