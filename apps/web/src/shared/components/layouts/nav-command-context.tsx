import { createContext, useContext } from "react";

interface NavCommandContextValue {
	open: () => void;
	close: () => void;
}

export const NavCommandContext = createContext<NavCommandContextValue>({
	open: () => {},
	close: () => {},
});

export function useNavCommand() {
	return useContext(NavCommandContext);
}
