/** Explicit scene ownership for the Act III → Act VI story timeline. */
export type ActFourPhase =
  | "act3"
  | "act4_exterior"
  | "act4_warp_in"
  | "act4_vault"
  | "act4_warp_out"
  | "act5"
  | "act6";

export type ActFourTransitionPhase = Extract<ActFourPhase, "act4_warp_in" | "act4_warp_out">;
