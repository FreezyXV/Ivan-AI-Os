// Review these questions and thresholds together when tuning decisions.
export const MIN_ALLOW_CONFIDENCE = 0.8;
export const MIN_ALLOW_PROBABILITY = 0.8;

export const permissionQuestion = {
  type: "choice",
  instructions: "Classify the proposed action using the supplied policy summaries. Select ALLOW only when it is clearly safe, reversible, and consistent with every applicable policy. Select REVIEW if context is missing or ambiguous. Select DENY for a clear policy violation. This classification cannot grant human approval.",
  criteria: {
    ALLOW: "Clearly within scope and safe to execute without human approval.",
    REVIEW: "Uncertain, missing context, or a person needs to examine the action.",
    DENY: "Clearly violates an applicable policy."
  }
};

export const routingQuestions = {
  manager: {
    type: "choice",
    instructions: "Which specialist should handle the enumerated requested_tasks? Tasks are ordered by the user's priority; choose the specialist needing first action. Use only these metadata, not assumed private context. Choose system for AI OS operation or other/unclear intent.",
    criteria: {
      business: "Business ideas, customer problems, pricing, validation or revenue opportunities.",
      career: "Jobs, freelance missions, applications, CV or professional positioning.",
      finance: "ETF, crypto, DCA, portfolio monitoring or financial research; proposals only.",
      knowledge: "Anakalypto, factual research, pedagogy or learning visuals.",
      engineering: "Coding, repositories, debugging, architecture or software delivery.",
      system: "Agent configuration, memory, tools, policies, infrastructure or unclear request."
    }
  },
  needs_details: {
    type: "noul",
    instructions: "Does the specialist need more details? details_available=false means essential execution details are missing; true means the caller has details locally. Judge readiness independently of selecting the domain.",
    criteria: {
      true: "The specialist is identifiable, but a file, subject, scope or other essential input is missing before execution.",
      false: "The request contains enough detail for the specialist to start the requested work."
    }
  },
  urgency: {
    type: "score",
    instructions: "Rate only the urgency metadata: none=0, soon=1, immediate=2. Do not infer a deadline from task type.",
    criteria: ["No stated deadline", "Time-sensitive but not immediate", "Immediate deadline or active incident"]
  }
};
