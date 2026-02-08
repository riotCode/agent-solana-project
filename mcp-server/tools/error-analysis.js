/**
 * Error Analysis Tool
 * Parses Anchor/Rust compiler errors and provides actionable feedback
 */

/**
 * Analyze build errors and provide structured feedback
 * Parses compiler output and maps to common Solana/Anchor issues
 */
export async function analyzeErrors(args) {
  const {
    errorOutput,
    errorType = 'compilation', // 'compilation', 'runtime', 'test'
    projectPath = '.'
  } = args;

  if (!errorOutput || typeof errorOutput !== 'string') {
    return {
      success: false,
      error: 'errorOutput is required and must be a string',
      details: 'Provide compiler output or error message'
    };
  }

  try {
    const errors = parseErrors(errorOutput);
    const analyzed = errors.map(err => analyzeError(err, errorType));

    return {
      success: true,
      errorCount: analyzed.length,
      errors: analyzed,
      summary: generateSummary(analyzed),
      recommendations: generateRecommendations(analyzed)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: 'Failed to analyze errors'
    };
  }
}

/**
 * Parse raw compiler output into structured error objects
 */
function parseErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;

  for (const line of lines) {
    // Rust compiler error pattern: error[E0425]: cannot find value `x` in this scope
    const errorMatch = line.match(/^error\[?([A-Z0-9]*)\]?:\s*(.+?)(?:\s+at |$)/);
    if (errorMatch) {
      if (currentError) errors.push(currentError);
      currentError = {
        type: errorMatch[1] || 'unknown',
        message: errorMatch[2],
        details: [],
        location: null
      };
      continue;
    }

    // File location pattern: --> src/lib.rs:10:5
    const locationMatch = line.match(/-->\s*([^:]+):(\d+):(\d+)/);
    if (locationMatch && currentError) {
      currentError.location = {
        file: locationMatch[1],
        line: parseInt(locationMatch[2]),
        column: parseInt(locationMatch[3])
      };
      continue;
    }

    // Additional error details
    if (line.trim() && currentError) {
      currentError.details.push(line.trim());
    }
  }

  if (currentError) errors.push(currentError);
  return errors;
}

/**
 * Analyze individual error and provide actionable fix
 */
function analyzeError(error, errorType) {
  const message = error.message.toLowerCase();
  
  // PDA seed issues
  if (message.includes('pda') || message.includes('seed')) {
    return {
      ...error,
      category: 'PDA_SEED',
      severity: 'high',
      fix: 'Ensure PDA seeds are properly derived using PublicKey.findProgramAddressSync()',
      example: `
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from('seed'), userKey.toBytes()],
  programId
);`,
      moreInfo: 'See: https://docs.solana.com/developing/programming-model/calling-between-programs#address-derivation'
    };
  }

  // Account ownership issues
  if (message.includes('owner') || message.includes('account') || message.includes('signer')) {
    return {
      ...error,
      category: 'ACCOUNT_OWNERSHIP',
      severity: 'critical',
      fix: 'Add proper account constraints and signer checks',
      example: `
#[account(
  mut,
  owner = crate::ID,
  constraint = owner.key() == owner_account.key()
)]
pub data: Account<'info, DataAccount>,
pub owner_account: Signer<'info>,`,
      moreInfo: 'See: https://www.anchor-lang.com/docs/accounts'
    };
  }

  // CPI (Cross-Program Invocation) issues
  if (message.includes('cpi') || message.includes('invoke')) {
    return {
      ...error,
      category: 'CPI_ISSUE',
      severity: 'high',
      fix: 'Ensure CPI accounts are properly constructed and signer seeds passed correctly',
      example: `
let cpi_accounts = TransferChecked {
  from: ctx.accounts.from.to_account_info(),
  mint: ctx.accounts.mint.to_account_info(),
  to: ctx.accounts.to.to_account_info(),
  authority: ctx.accounts.authority.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
transfer_checked(cpi_ctx, amount, decimals)?;`,
      moreInfo: 'See: https://docs.solana.com/developing/programming-model/calling-between-programs'
    };
  }

  // Constraint violations
  if (message.includes('constraint') || message.includes('invariant')) {
    return {
      ...error,
      category: 'CONSTRAINT_VIOLATION',
      severity: 'medium',
      fix: 'Review account constraints and ensure data satisfies all conditions',
      example: `#[account(constraint = data.authority == ctx.accounts.authority.key())]`,
      moreInfo: 'See: https://www.anchor-lang.com/docs/accounts#constraints'
    };
  }

  // Compute unit overflow
  if (message.includes('compute') || message.includes('instruction')) {
    return {
      ...error,
      category: 'COMPUTE_LIMIT',
      severity: 'high',
      fix: 'Optimize computation or request additional compute units',
      example: `
// Request extra compute units
compute_budget::ComputeBudgetInstruction::set_compute_unit_limit(400_000),`,
      moreInfo: 'See: https://docs.solana.com/developing/programming-model/compute-budgets'
    };
  }

  // Type mismatch
  if (message.includes('type') || message.includes('expected')) {
    return {
      ...error,
      category: 'TYPE_MISMATCH',
      severity: 'medium',
      fix: 'Ensure types match expected values. Check account types and instruction arguments.',
      example: 'Verify instruction argument types match IDL specification',
      moreInfo: 'See: https://www.anchor-lang.com/docs/idl'
    };
  }

  // Lifetime issues
  if (message.includes('lifetime') || message.includes("'info")) {
    return {
      ...error,
      category: 'LIFETIME_ISSUE',
      severity: 'medium',
      fix: "Ensure account references use correct lifetime 'info",
      example: `pub account: Account<'info, DataAccount>`,
      moreInfo: 'See: https://www.anchor-lang.com/docs/accounts'
    };
  }

  // Generic error categorization
  return {
    ...error,
    category: 'UNKNOWN',
    severity: 'low',
    fix: 'Review error message and check Solana documentation',
    example: null,
    moreInfo: 'See: https://docs.solana.com/'
  };
}

/**
 * Generate summary of error patterns
 */
function generateSummary(analyzed) {
  const categories = {};
  const severities = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const error of analyzed) {
    categories[error.category] = (categories[error.category] || 0) + 1;
    severities[error.severity]++;
  }

  return {
    totalErrors: analyzed.length,
    byCategory: categories,
    bySeverity: severities,
    criticalIssues: severities.critical > 0,
    recommendations: Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => `Focus on ${cat} issues`)
  };
}

/**
 * Generate actionable recommendations based on errors
 */
function generateRecommendations(analyzed) {
  const recommendations = [];
  const categories = new Set(analyzed.map(e => e.category));

  if (categories.has('PDA_SEED')) {
    recommendations.push({
      priority: 'high',
      action: 'Verify PDA derivation seeds match between IDL and program code',
      command: 'npm run test -- --grep "pda"'
    });
  }

  if (categories.has('ACCOUNT_OWNERSHIP')) {
    recommendations.push({
      priority: 'critical',
      action: 'Add owner and signer constraints to all account fields',
      command: 'See example in error fix'
    });
  }

  if (categories.has('CPI_ISSUE')) {
    recommendations.push({
      priority: 'high',
      action: 'Validate CPI account ordering and signer seeds',
      command: 'Check called program IDL for correct account order'
    });
  }

  if (categories.has('COMPUTE_LIMIT')) {
    recommendations.push({
      priority: 'high',
      action: 'Optimize algorithm or request compute budget increase',
      command: 'Add ComputeBudgetInstruction::set_compute_unit_limit()'
    });
  }

  if (categories.has('CONSTRAINT_VIOLATION')) {
    recommendations.push({
      priority: 'medium',
      action: 'Review all constraint conditions and ensure data satisfies them',
      command: 'Add detailed error messages with #[error_code]'
    });
  }

  return recommendations;
}

/**
 * Common Anchor/Solana error patterns and fixes
 */
export const ERROR_PATTERNS = {
  'PDA_SEED': {
    pattern: /pda|seed|findProgramAddressSync/i,
    severity: 'high',
    message: 'PDA derivation seed mismatch'
  },
  'ACCOUNT_OWNERSHIP': {
    pattern: /owner|account|signer|mut/i,
    severity: 'critical',
    message: 'Account constraint or ownership issue'
  },
  'CPI_ISSUE': {
    pattern: /cpi|invoke|call|cross.program/i,
    severity: 'high',
    message: 'Cross-program invocation setup error'
  },
  'COMPUTE_LIMIT': {
    pattern: /compute|instruction.*exceeded|budget/i,
    severity: 'high',
    message: 'Compute unit limit exceeded'
  },
  'TYPE_MISMATCH': {
    pattern: /type|expected|found/i,
    severity: 'medium',
    message: 'Type mismatch between expected and actual'
  },
  'LIFETIME_ISSUE': {
    pattern: /lifetime|'info|'a/i,
    severity: 'medium',
    message: 'Rust lifetime issue with account references'
  }
};
