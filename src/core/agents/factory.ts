import { join } from "node:path";
import {
  buildAgentOutputSchema,
  type Agent,
  type AgentOutputCommitField,
} from "./types.js";
import { getAcpTarget, isAcpSpec, type AgentSpec } from "../config.js";
import type { RunInfo } from "../run.js";
import { AcpAgent } from "./acp.js";
import { ClaudeAgent } from "./claude.js";
import { CopilotAgent } from "./copilot.js";
import { CodexAgent } from "./codex.js";
import { CursorAgent } from "./cursor.js";
import { OpenCodeAgent } from "./opencode.js";
import { PiAgent } from "./pi.js";
import { RovoDevAgent } from "./rovodev.js";

export interface CreateAgentOptions {
  includeStopField: boolean;
  commitFields?: AgentOutputCommitField[];
  acpRegistryOverrides?: Record<string, string>;
  unattended?: boolean;
}

function withUnattended<T extends object>(
  deps: T,
  unattended?: boolean,
): T | (T & { unattended: true }) {
  return unattended ? { ...deps, unattended: true } : deps;
}

export function createAgent(
  spec: AgentSpec,
  runInfo: RunInfo,
  pathOverride: string | undefined,
  agentArgsOverride: string[] | undefined,
  options: CreateAgentOptions,
): Agent {
  const schema = buildAgentOutputSchema({
    includeStopField: options.includeStopField,
    commitFields: options.commitFields,
  });

  if (isAcpSpec(spec)) {
    return new AcpAgent(
      withUnattended(
        {
          target: getAcpTarget(spec),
          schema,
          runId: runInfo.runId,
          sessionStateDir: join(runInfo.runDir, "acp-sessions"),
          registryOverrides: options.acpRegistryOverrides,
        },
        options.unattended,
      ),
    );
  }

  const name = spec;
  switch (name) {
    case "claude":
      return new ClaudeAgent(
        withUnattended(
          {
            bin: pathOverride,
            extraArgs: agentArgsOverride,
            schema,
          },
          options.unattended,
        ),
      );
    case "codex":
      return new CodexAgent(
        runInfo.schemaPath,
        withUnattended(
          {
            bin: pathOverride,
            extraArgs: agentArgsOverride,
          },
          options.unattended,
        ),
      );
    case "copilot":
      return new CopilotAgent(
        withUnattended(
          {
            bin: pathOverride,
            extraArgs: agentArgsOverride,
            schema,
          },
          options.unattended,
        ),
      );
    case "opencode":
      return new OpenCodeAgent(
        withUnattended(
          {
            bin: pathOverride,
            extraArgs: agentArgsOverride,
            schema,
          },
          options.unattended,
        ),
      );
    case "pi":
      return new PiAgent({
        bin: pathOverride,
        extraArgs: agentArgsOverride,
        schema,
      });
    case "cursor":
      return new CursorAgent(
        withUnattended(
          {
            bin: pathOverride,
            extraArgs: agentArgsOverride,
            schema,
          },
          options.unattended,
        ),
      );
    case "rovodev":
      return new RovoDevAgent(runInfo.schemaPath, {
        bin: pathOverride,
        extraArgs: agentArgsOverride,
      });
  }
}
