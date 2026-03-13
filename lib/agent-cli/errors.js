import { errorCauses } from "error-causes";

const [agentErrors, handleAgentErrors] = errorCauses({
  AgentConfigParseError: {
    code: "AGENT_CONFIG_PARSE_ERROR",
    message: "Failed to parse agent config file",
  },
  AgentConfigReadError: {
    code: "AGENT_CONFIG_READ_ERROR",
    message: "Failed to read agent config file",
  },
  AgentConfigValidationError: {
    code: "AGENT_CONFIG_VALIDATION_ERROR",
    message: "Agent config is invalid",
  },
});

const {
  AgentConfigReadError,
  AgentConfigParseError,
  AgentConfigValidationError,
} = agentErrors;

export {
  AgentConfigReadError,
  AgentConfigParseError,
  AgentConfigValidationError,
  handleAgentErrors,
};
