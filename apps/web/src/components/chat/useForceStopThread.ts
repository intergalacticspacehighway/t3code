import { useAtomValue } from "@effect/atom-react";
import type { EnvironmentId, ThreadId } from "@t3tools/contracts";
import { useState } from "react";

import { useServerConfigs } from "../../state/entities";
import { orchestrationEnvironment } from "../../state/orchestration";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import { useAtomCommand } from "../../state/use-atom-command";
import { toastManager } from "../ui/toast";

/** Force stop for an agent that no longer answers Stop; shared by every place that offers it. */
export function useForceStopThread(environmentId: EnvironmentId) {
  const forceStop = useAtomCommand(orchestrationEnvironment.forceStopThread);
  const permitted = useAtomValue(
    orchestrationEnvironment.forceStopThread.permissionAtom(environmentId),
  );
  const supported =
    useServerConfigs().get(environmentId)?.environment.capabilities.threadForceStop === true;
  const canForceStop = permitted && supported;
  const [stoppingThreadId, setStoppingThreadId] = useState<ThreadId | null>(null);
  const forceStopThread = async (threadId: ThreadId) => {
    if (!canForceStop || stoppingThreadId !== null) return;
    setStoppingThreadId(threadId);
    const result = await forceStop({ environmentId, input: { threadId } });
    setStoppingThreadId(null);
    if (result._tag === "Failure") {
      if (isAtomCommandInterrupted(result)) return;
      const error = squashAtomCommandFailure(result);
      toastManager.add({
        type: "error",
        title: "Could not force stop the agent",
        description: error instanceof Error ? error.message : undefined,
      });
      return;
    }
    const others = result.value.sharedWithThreadIds.length;
    if (result.value.outcome === "shared") {
      toastManager.add({
        type: "info",
        title: "Turn stopped; the agent process kept running",
        description: `It is shared with ${others} other working ${others === 1 ? "thread" : "threads"}. Stop those to free it.`,
      });
    }
  };
  return { canForceStop, stoppingThreadId, forceStopThread };
}
