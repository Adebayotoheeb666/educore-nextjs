import { useAppDispatch } from "@/redux/hooks";
import { startLoading, stopLoading, setLoading } from "@/redux/features/ui/loadingSlice";

export function useGlobalLoading() {
  const dispatch = useAppDispatch();

  const show = (message?: string) => {
    dispatch(startLoading(message));
  };

  const hide = () => {
    dispatch(stopLoading());
  };

  const set = (isLoading: boolean, message?: string) => {
    dispatch(setLoading({ isLoading, message }));
  };

  return { show, hide, set };
}
