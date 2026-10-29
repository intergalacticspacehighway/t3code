import { useAtomValue } from "@effect/atom-react";
import { quietRunSince } from "@t3tools/client-runtime/state/thread-execution";
import type { EnvironmentId, ThreadId } from "@t3tools/contracts";

import { serverEnvironment } from "../state/server";

/** Selects one thread's entry, so a quiet-runs update re-renders only the rows it changes. */
export function useQuietRunSince(
  environmentId: EnvironmentId,
  threadId: ThreadId | null,
): string | null {
  return useAtomValue(serverEnvironment.configValueAtom(environmentId), (config) =>
    threadId === null ? null : quietRunSince(config, threadId),
  );
}
