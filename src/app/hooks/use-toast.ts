"use client";

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Above the Actions constant
/* eslint-disable @typescript-eslint/no-unused-vars */
const Actions = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;
/* eslint-enable @typescript-eslint/no-unused-vars */

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | {
      type: typeof Actions.ADD_TOAST;
      toast: ToasterToast;
    }
  | {
      type: typeof Actions.UPDATE_TOAST;
      toast: Partial<ToasterToast>;
    }
  | {
      type: typeof Actions.DISMISS_TOAST;
      toastId?: ToasterToast["id"];
    }
  | {
      type: typeof Actions.REMOVE_TOAST;
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

function addToRemoveQueue(toastId: string) {
  setTimeout(() => {
    dispatch({ type: Actions.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case Actions.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case Actions.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case Actions.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case Actions.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: Actions.UPDATE_TOAST, // Changed from string literal
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: Actions.DISMISS_TOAST, toastId: id }); // Changed from string literal

  dispatch({
    type: Actions.ADD_TOAST, // Changed from string literal
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: Actions.DISMISS_TOAST, toastId }), // Changed from string literal
  };
}

export { useToast, toast };