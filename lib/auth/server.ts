import { cache } from "react";
import { getSessionUser } from "./session";

export const getCurrentUser = cache(getSessionUser);
