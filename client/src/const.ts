export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Simple login redirect - no OAuth needed
export const getLoginUrl = () => {
  return "/login";
};
