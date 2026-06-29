import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 30_000,       // 30s antes de considerar dado stale
			gcTime: 5 * 60_000,      // 5min no cache após desmount
		},
	},
});