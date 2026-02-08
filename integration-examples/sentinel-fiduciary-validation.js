/**
 * Sentinel Fiduciary Validation Integration Example
 * 
 * Shows how Sentinel agents can use SolAgent Forge's error analysis
 * and security scanner to validate agent decision-making against
 * fiduciary duties (loyalty, care, prudence, confidentiality, transparency).
 * 
 * Use case: Before an agent executes a financial decision, validate it
 * against user's stated constraints and risk profile.
 */

import { MCPClient } from '../mcp-client.js';

const client = new MCPClient({
  host: 'localhost',
  port: 3000,
  protocol: 'mcp'
});

/**
 * Fiduciary Context - what the user cares about
 */
class FiduciaryContext {
  constructor({
    userId,
    goals = [],
    constraints = [],
    riskTolerance = 'medium',
    preferences = {}
  }) {
    this.userId = userId;
    this.goals = goals;  // ['maximize_returns', 'preserve_capital']
    this.constraints = constraints;  // ['max_drawdown:10%', 'no_leverage']
    this.riskTolerance = riskTolerance;  // 'low', 'medium', 'high'
    this.preferences = preferences;  // custom preferences
  }
}

/**
 * Proposed Action - what the agent wants to do
 */
class ProposedAction {
  constructor({
    agent,
    action,
    reasoning,
    expectedOutcome,
    risks = []
  }) {
    this.agent = agent;  // Agent ID or name
    this.action = action;  // e.g., "Open 5x leveraged SOL position"
    this.reasoning = reasoning;  // Why the agent thinks this is good
    this.expectedOutcome = expectedOutcome;  // Expected profit/result
    this.risks = risks;  // Known risks
  }
}

/**
 * Validates a proposed action against user's fiduciary context
 */
async function validateFiduciaryAction(context, action) {
  console.log(`\n📋 Fiduciary Validation: "${action.action}"`);
  console.log(`   Agent: ${action.agent}`);
  console.log(`   User: ${context.userId}`);
  
  const violations = [];
  
  // DUTY 1: LOYALTY - Does action serve user, not agent?
  const loyaltyCheck = checkLoyalty(context, action);
  if (!loyaltyCheck.pass) {
    violations.push({
      duty: 'LOYALTY',
      severity: 'HIGH',
      issue: loyaltyCheck.reason,
      recommendation: loyaltyCheck.fix
    });
  }
  
  // DUTY 2: CARE - Is the action competent and thorough?
  const careCheck = checkCare(context, action);
  if (!careCheck.pass) {
    violations.push({
      duty: 'CARE',
      severity: careCheck.severity || 'MEDIUM',
      issue: careCheck.reason,
      recommendation: careCheck.fix
    });
  }
  
  // DUTY 3: PRUDENCE - Is decision reasonable given context?
  const prudenceCheck = checkPrudence(context, action);
  if (!prudenceCheck.pass) {
    violations.push({
      duty: 'PRUDENCE',
      severity: prudenceCheck.severity || 'MEDIUM',
      issue: prudenceCheck.reason,
      recommendation: prudenceCheck.fix
    });
  }
  
  // DUTY 4: CONSTRAINT COMPLIANCE - User-defined hard limits
  const constraintCheck = checkConstraints(context, action);
  if (!constraintCheck.pass) {
    violations.push({
      duty: 'COMPLIANCE',
      severity: 'CRITICAL',
      issue: constraintCheck.reason,
      recommendation: constraintCheck.fix
    });
  }
  
  // DUTY 5: TRANSPARENCY - Is reasoning clear?
  const transparencyCheck = checkTransparency(action);
  if (!transparencyCheck.pass) {
    violations.push({
      duty: 'TRANSPARENCY',
      severity: 'MEDIUM',
      issue: transparencyCheck.reason,
      recommendation: transparencyCheck.fix
    });
  }
  
  // Report findings
  const result = {
    action: action.action,
    compliant: violations.length === 0,
    violationCount: violations.length,
    violations: violations,
    decision: violations.length === 0 ? 'APPROVED' : 'BLOCKED',
    timestamp: new Date().toISOString()
  };
  
  printValidationReport(result);
  
  return result;
}

function checkLoyalty(context, action) {
  // Check for self-dealing, agent profit over user profit
  const agentBenefit = action.reasoning.includes('agent revenue') ||
                      action.reasoning.includes('fee') ||
                      action.reasoning.includes('commission');
  
  const userBenefit = action.expectedOutcome.includes('profit') ||
                     action.expectedOutcome.includes('return') ||
                     action.expectedOutcome.includes('gain');
  
  if (agentBenefit && !userBenefit) {
    return {
      pass: false,
      reason: 'Action prioritizes agent revenue over user return',
      fix: 'Ensure agent profit is secondary to user objectives'
    };
  }
  
  return { pass: true };
}

function checkCare(context, action) {
  // Check for due diligence, analysis quality
  const hasRiskAnalysis = action.risks && action.risks.length > 0;
  const hasReasoningDetail = action.reasoning && action.reasoning.length > 50;
  
  if (!hasRiskAnalysis) {
    return {
      pass: false,
      severity: 'HIGH',
      reason: 'No risk analysis provided. Insufficient due diligence.',
      fix: 'Identify and document at least 3 key risks before proceeding'
    };
  }
  
  if (!hasReasoningDetail) {
    return {
      pass: false,
      severity: 'MEDIUM',
      reason: 'Reasoning is vague. Unclear decision logic.',
      fix: 'Provide detailed analysis explaining market conditions and strategy'
    };
  }
  
  return { pass: true };
}

function checkPrudence(context, action) {
  // Check if action is reasonable given market conditions and context
  // For now, simple heuristic: extreme actions need higher conviction
  
  const isAggressive = action.action.includes('5x') ||
                      action.action.includes('10x') ||
                      action.action.includes('leverage') ||
                      action.action.includes('all-in');
  
  if (isAggressive && context.riskTolerance === 'low') {
    return {
      pass: false,
      severity: 'HIGH',
      reason: `Aggressive action (${action.action}) conflicts with low risk tolerance`,
      fix: 'Reduce position size or choose lower-risk strategy'
    };
  }
  
  return { pass: true };
}

function checkConstraints(context, action) {
  // Hard constraints that user explicitly set
  for (const constraint of context.constraints) {
    const [key, value] = constraint.split(':');
    
    if (key === 'no_leverage' && action.action.includes('leverage')) {
      return {
        pass: false,
        reason: `Action violates constraint: "${constraint}"`,
        fix: 'User explicitly prohibits leveraged positions. Use spot trading instead.'
      };
    }
    
    if (key === 'max_drawdown' && action.action.includes('high risk')) {
      return {
        pass: false,
        reason: `Action may exceed max drawdown of ${value}`,
        fix: 'Model position size to stay within user drawdown limit'
      };
    }
  }
  
  return { pass: true };
}

function checkTransparency(action) {
  // Check if reasoning is clear and detailed
  if (!action.reasoning || action.reasoning.length < 30) {
    return {
      pass: false,
      reason: 'Reasoning is too brief to evaluate properly',
      fix: 'Provide detailed explanation of market analysis and strategy'
    };
  }
  
  return { pass: true };
}

function printValidationReport(result) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Fiduciary Validation Report`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Decision: ${result.decision}`);
  console.log(`Violations: ${result.violationCount}`);
  
  if (result.violations.length > 0) {
    console.log(`\nFound issues:`);
    result.violations.forEach((v, i) => {
      const severityIcon = {
        'CRITICAL': '🚫',
        'HIGH': '⚠️ ',
        'MEDIUM': '📋'
      }[v.severity] || '•';
      
      console.log(`\n${severityIcon} ${v.duty} (${v.severity})`);
      console.log(`   Issue: ${v.issue}`);
      console.log(`   Fix: ${v.recommendation}`);
    });
  } else {
    console.log(`\n✅ All fiduciary duties satisfied. Action approved.`);
  }
  
  console.log(`${'='.repeat(60)}\n`);
  
  return result;
}

/**
 * Integration with SolAgent Forge error analysis for deeper investigation
 */
async function analyzeActionFailure(action, error) {
  /**
   * If an action fails, get detailed error analysis from SolAgent Forge
   * to identify root cause and fiduciary implications
   */
  console.log(`\n🔍 Analyzing failure for fiduciary implications...`);
  
  const analysis = await client.call('analyze_errors', {
    error: error,
    context: 'agent_execution',
    actionContext: action.action
  });
  
  if (!analysis.success) {
    console.error('Error analysis failed:', analysis.error);
    return null;
  }
  
  console.log(`Root Cause: ${analysis.data.analysis}`);
  console.log(`Recommendation: ${analysis.data.recommendation}`);
  
  // Check if failure reveals fiduciary concern
  const fiduciaryRisk = analysis.data.analysis.includes('unauthorized') ||
                       analysis.data.analysis.includes('frontrun') ||
                       analysis.data.analysis.includes('slippage');
  
  if (fiduciaryRisk) {
    console.log(`\n⚠️  FIDUCIARY CONCERN: Failure suggests alignment issues`);
  }
  
  return analysis.data;
}

/**
 * Example: Validate a trading decision
 */
async function validateTradeDecision() {
  // User's fiduciary context
  const userContext = new FiduciaryContext({
    userId: 'user-0x1234',
    goals: ['maximize_returns', 'preserve_capital'],
    constraints: ['max_drawdown:10%', 'no_leverage', 'approved_protocols:jupiter,marinade'],
    riskTolerance: 'medium',
    preferences: { maxSlippage: 0.01, preferStakingYield: true }
  });
  
  // Proposed trade by agent
  const proposedTrade = new ProposedAction({
    agent: 'trading-agent-001',
    action: 'Open 5x leveraged long position on SOL',
    reasoning: 'SOL technical setup looks bullish. 5x gives optimal Kelly sizing given our edge.',
    expectedOutcome: '25% profit if target level hit, 5% loss if invalidated',
    risks: ['Liquidation risk if SOL drops 10%+', 'Oracle manipulation on secondary markets']
  });
  
  // Validate
  const validation = await validateFiduciaryAction(userContext, proposedTrade);
  
  // In this case, validation returns BLOCKED because:
  // 1. Leverage violates "no_leverage" constraint
  // 2. 5x is aggressive for medium risk tolerance
  
  return validation;
}

// Export for Sentinel integration
export { 
  FiduciaryContext, 
  ProposedAction, 
  validateFiduciaryAction,
  analyzeActionFailure 
};
